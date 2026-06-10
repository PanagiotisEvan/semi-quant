// ─── Material constants ────────────────────────────────────────────────────────

// Electron mobility data: Sze & Ng (3rd ed.), Jacoboni et al.
// Hole mobility data: Masetti et al.
// ni300: Green (1990) for Si; Sze for Ge; Morkoc for GaN
// Debye temperatures: Kittel, solid-state tables

import type {MaterialId, MaterialParams} from "./formulas.ts";

export const MATERIALS: Record<MaterialId, MaterialParams> = {
    Si: {
        Eg0: 1.17, alpha: 4.73e-4, beta: 636, D: -10,
        mu_min_n: 68.5,  mu_max_n: 1414,  N_ref_n: 9.20e16, a_n: 0.711, gamma_n: 2.40, k_eps_n:  17.0,
        mu_min_p: 44.9,  mu_max_p: 470.5, N_ref_p: 2.23e17, a_p: 0.719, gamma_p: 2.20, k_eps_p:  -5.2,
        ni300: 1.5e10,
        thetaD: 645, M: 28.085, nu: 0.28, a0: 5.431,
        isGraphene: false,
    },
    Ge: {
        Eg0: 0.744, alpha: 4.77e-4, beta: 235, D: -12,
        mu_min_n: 100,  mu_max_n: 3900, N_ref_n: 1.26e17, a_n: 0.56, gamma_n: 1.66, k_eps_n:  10.0,
        mu_min_p:  50,  mu_max_p: 1900, N_ref_p: 2.70e17, a_p: 0.56, gamma_p: 2.33, k_eps_p:  -4.0,
        ni300: 2.4e13,
        thetaD: 374, M: 72.630, nu: 0.26, a0: 5.658,
        isGraphene: false,
    },
    GaN: {
        Eg0: 3.51, alpha: 9.39e-4, beta: 772, D: -9,
        mu_min_n:  55, mu_max_n: 1000, N_ref_n: 2.0e17, a_n: 1.0, gamma_n: 1.50, k_eps_n:   8.0,
        mu_min_p:   3, mu_max_p:  170, N_ref_p: 3.0e17, a_p: 1.0, gamma_p: 2.00, k_eps_p:  -3.0,
        ni300: 1e-10,   // unmeasurably small; ensures n ≈ N_D up to 600 K
        thetaD: 600, M: 41.865, nu: 0.35, a0: 3.189,  // a-axis of wurtzite
        isGraphene: false,
    },
    Graphene: {
        // No band gap in the ±2% strain range; Varshni terms unused
        Eg0: 0, alpha: 0, beta: 1, D: 0,
        // Acoustic-phonon-limited: effectively just mu_max * (T/300)^-γ
        mu_min_n: 0, mu_max_n: 200000, N_ref_n: 1e12, a_n: 1, gamma_n: 1.0, k_eps_n: 0,
        mu_min_p: 0, mu_max_p: 200000, N_ref_p: 1e12, a_p: 1, gamma_p: 1.0, k_eps_p: 0,
        ni300: 0,
        thetaD: 2300, M: 12.011, nu: 0.16, a0: 2.461,
        isGraphene: true,
    },
};