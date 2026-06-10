// Physics engine: sliders in → numbers out
// Units throughout: T [K], N [cm⁻³ bulk | cm⁻² graphene], strain [dimensionless], energies [eV],
//   mobility [cm²/V·s], conductivity [S/cm bulk | S/□ graphene], resistivity [Ω·cm | Ω/□]

// ─── Physical constants ────────────────────────────────────────────────────────

export const k_B = 8.617333e-5;      // Boltzmann, eV/K
export const q   = 1.602176634e-19;  // elementary charge, C
// Minimum graphene sheet conductivity 4e²/h [S/□]
export const GRAPHENE_MIN_SIGMA = (4 * (1.602176634e-19) ** 2) / 6.62607015e-34;

// ─── Types ─────────────────────────────────────────────────────────────────────

export type MaterialId = "Si" | "Ge" | "GaN" | "Graphene";
export type DopingType = "n" | "p";

export interface MaterialParams {
  // Band structure
  Eg0:   number;   // band gap at 0 K, eV
  alpha: number;   // Varshni α, eV/K
  beta:  number;   // Varshni β, K
  D:     number;   // linear deformation potential, eV per unit strain

  // Electron mobility (Caughey–Thomas + piezoresistive)
  mu_min_n: number;  // cm²/V·s
  mu_max_n: number;
  N_ref_n:  number;  // reference doping, cm⁻³
  a_n:      number;  // doping exponent
  gamma_n:  number;  // temperature power-law exponent
  k_eps_n:  number;  // piezoresistive coefficient, per unit strain

  // Hole mobility (Caughey–Thomas + piezoresistive)
  mu_min_p: number;
  mu_max_p: number;
  N_ref_p:  number;
  a_p:      number;
  gamma_p:  number;
  k_eps_p:  number;

  // Intrinsic carrier concentration at 300 K, zero strain [cm⁻³]
  // Used as calibration anchor for ni(T); GaN: ~1e-10 (effectively 0), graphene: 0
  ni300: number;

  // Visualization
  thetaD: number;  // Debye temperature, K
  M:      number;  // average atomic mass, amu
  nu:     number;  // Poisson ratio (for Poisson contraction under uniaxial strain)
  a0:     number;  // equilibrium lattice constant, Å

  isGraphene: boolean;
}

// ─── Layer 1: Physics engine ───────────────────────────────────────────────────

// Eg(T, ε) = Eg(0) − α·T²/(T+β) + D·ε
// Varshni temperature correction + linear deformation potential (Pikus–Bir)
// Graphene: D=0, so the gap stays 0 across the ±2% slider range
export function bandGap(mat: MaterialParams, T: number, strain: number): number {
  const T_ = Math.max(T, 1);  // guard T=0 in Varshni denominator
  return Math.max(0, mat.Eg0 - (mat.alpha * T_ ** 2) / (T_ + mat.beta) + mat.D * strain);
}

// Caughey–Thomas model: base mobility as function of temperature and doping
function caugheyThomas(
  mu_min: number, mu_max: number, N_ref: number, a: number, gamma: number,
  T: number, N: number,
): number {
  const mu_T = mu_min + (mu_max * (T / 300) ** -gamma - mu_min) / (1 + (N / N_ref) ** a);
  return Math.max(mu_T, 0);
}

// μ_final = μ_CT(T, N) · (1 + k_ε·ε)
// For graphene: pure temperature power law, no doping saturation
export function mobility(
  mat: MaterialParams, T: number, N: number, strain: number, type: DopingType,
): number {
  if (mat.isGraphene) {
    return mat.mu_max_n * (T / 300) ** -mat.gamma_n;
  }
  const [mu_min, mu_max, N_ref, a, gamma, k_eps] = type === "n"
    ? [mat.mu_min_n, mat.mu_max_n, mat.N_ref_n, mat.a_n, mat.gamma_n, mat.k_eps_n]
    : [mat.mu_min_p, mat.mu_max_p, mat.N_ref_p, mat.a_p, mat.gamma_p, mat.k_eps_p];
  const mu_base = caugheyThomas(mu_min, mu_max, N_ref, a, gamma, T, N);
  return mu_base * (1 + k_eps * strain);
}

// ni(T) = ni300 · (T/300)^(3/2) · exp( Eg(300,0)/2k·300 − Eg(T,ε)/2k·T )
// Expressed in terms of calibrated ni300 to avoid NcNv effective-mass ambiguity
export function intrinsicConcentration(mat: MaterialParams, T: number, strain: number): number {
  if (mat.isGraphene || mat.ni300 <= 0) return 0;
  const T_ = Math.max(T, 1);
  const Eg300 = bandGap(mat, 300, 0);
  const EgT   = bandGap(mat, T_, strain);
  const exponent = Eg300 / (2 * k_B * 300) - EgT / (2 * k_B * T_);
  return mat.ni300 * (T_ / 300) ** 1.5 * Math.exp(exponent);
}

// n = ND/2 + √((ND/2)² + ni²),  p = ni²/n
// Handles the intrinsic crossover: Ge at 600 K goes intrinsic, GaN doesn't flinch
export function carrierConcentrations(
  mat: MaterialParams, T: number, N_D: number, strain: number,
): { n: number; p: number; ni: number } {
  if (mat.isGraphene) {
    return { n: N_D, p: 0, ni: 0 };  // N_D is sheet carrier density for graphene
  }
  const ni     = intrinsicConcentration(mat, T, strain);
  const halfND = N_D / 2;
  const n      = halfND + Math.sqrt(halfND ** 2 + ni ** 2);
  const p      = ni ** 2 / n;
  return { n, p, ni };
}

// σ = q·(n·μn + p·μp) [S/cm]
// Graphene: σ_sheet = max(ns·q·μ, 4e²/h) [S/□]
//   ns [cm⁻²] · q [C] · μ [cm²/V·s] → S (per square, since cm⁻²·cm² = 1)
export function conductivity(
  mat: MaterialParams, n: number, p: number, mu_n: number, mu_p: number,
): number {
  if (mat.isGraphene) {
    return Math.max(n * q * mu_n, GRAPHENE_MIN_SIGMA);
  }
  return q * (n * mu_n + p * mu_p);  // S/cm
}

// ─── Master function ───────────────────────────────────────────────────────────

export interface SemiconductorProperties {
  Eg:    number;  // eV
  n:     number;  // cm⁻³ (cm⁻² graphene)
  p:     number;
  ni:    number;
  mu_n:  number;  // cm²/V·s
  mu_p:  number;
  sigma: number;  // S/cm (S/□ graphene)
  rho:   number;  // Ω·cm (Ω/□ graphene)
  a:     number;  // Å, strained lattice constant
}

export function computeProperties(
  mat: MaterialParams,
  T: number,
  N: number,
  type: DopingType,
  strain: number,
): SemiconductorProperties {
  const Eg           = bandGap(mat, T, strain);
  const { n, p, ni } = carrierConcentrations(mat, T, N, strain);
  const mu_n         = mobility(mat, T, N, strain, "n");
  const mu_p         = mobility(mat, T, N, strain, "p");
  const sigma        = conductivity(mat, n, p, mu_n, mu_p);
  const rho          = sigma > 0 ? 1 / sigma : Infinity;
  const a            = mat.a0 * (1 + strain);
  return { Eg, n, p, ni, mu_n, mu_p, sigma, rho, a };
}

// ─── Layer 2: Visualization helpers ───────────────────────────────────────────

// RMS thermal displacement [Å], Debye–Waller approximation
// ⟨u²⟩ ∝ T / (M · θ_D²); JITTER_SCALE set so Si at 600 K ≈ 0.30 Å
// Graphene's enormous θ_D=2300 K keeps it nearly motionless even at 600 K
const JITTER_SCALE = 42;
export function thermalJitterAmplitude(mat: MaterialParams, T: number): number {
  return JITTER_SCALE * Math.sqrt(T) / (Math.sqrt(mat.M) * mat.thetaD);
}

// Artistic log-mapped dopant atom count for a supercell, range [0, 10]
// 0 below 1e16 cm⁻³; 1 at ~1e16; 10 at 1e20 cm⁻³
export function dopantVisualCount(N: number): number {
  if (N < 1e16) return 0;
  return Math.min(10, Math.round(10 * (Math.log10(N) - 16) / 4));
}

// Artistic log-mapped free-carrier sphere count, range [0, 10]
// Covers 1e8 (near-dark) → 1e20 (degenerate)
export function carrierVisualCount(n: number): number {
  if (n < 1e8) return 0;
  return Math.min(10, Math.max(0, Math.round(10 * (Math.log10(n) - 8) / 12)));
}

// Lattice vectors under uniaxial strain with Poisson contraction
// Strain applied along x; transverse axes contract by ν·ε
export function strainedLatticeVectors(
  a0: number, strain: number, nu: number,
): { ax: number; ay: number; az: number } {
  return {
    ax: a0 * (1 + strain),
    ay: a0 * (1 - nu * strain),
    az: a0 * (1 - nu * strain),
  };
}

// Dopant element symbol for substitutional visualization
export function dopantAtomSymbol(materialId: MaterialId, type: DopingType): string {
  const map: Record<MaterialId, Record<DopingType, string>> = {
    Si:       { n: "P",  p: "B"  },
    Ge:       { n: "As", p: "B"  },
    GaN:      { n: "Si", p: "Mg" },
    Graphene: { n: "N",  p: "B"  },
  };
  return map[materialId][type];
}
