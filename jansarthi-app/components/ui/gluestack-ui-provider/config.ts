"use client";
import { vars } from "nativewind";

export const config = {
  light: vars({
    /* Brand Colors - Uttarakhand Green (Primary action color) */
    "--color-brand-0": "228 255 244",
    "--color-brand-50": "202 255 232",
    "--color-brand-100": "162 241 192",
    "--color-brand-200": "132 211 162",
    "--color-brand-300": "72 151 102",
    "--color-brand-400": "25 135 84", // Uttarakhand Green Light #198754
    "--color-brand-500": "4 106 56", // Uttarakhand Green #046A38
    "--color-brand-600": "3 74 40", // Uttarakhand Green Dark #034A28
    "--color-brand-700": "3 58 31",
    "--color-brand-800": "2 42 23",
    "--color-brand-900": "2 32 18",
    "--color-brand-950": "1 21 12",

    /* Primary Text Colors - Deep Earthy Brown (20.6:1 contrast - AAA) */
    "--color-primary-0": "255 255 255",
    "--color-primary-50": "248 249 250",
    "--color-primary-100": "235 234 234",
    "--color-primary-200": "200 200 200",
    "--color-primary-300": "142 142 142",
    "--color-primary-400": "96 96 96",
    "--color-primary-500": "21 2 2", // Primary Text #150202
    "--color-primary-600": "17 1 1",
    "--color-primary-700": "13 1 1",
    "--color-primary-800": "10 1 1",
    "--color-primary-900": "8 0 0",
    "--color-primary-950": "5 0 0",

    /* Secondary Text - Grey (5.9:1 contrast - AA) */
    "--color-secondary-0": "255 255 255",
    "--color-secondary-50": "248 248 248",
    "--color-secondary-100": "235 234 234",
    "--color-secondary-200": "200 200 200",
    "--color-secondary-300": "142 142 142",
    "--color-secondary-400": "142 142 142",
    "--color-secondary-500": "96 96 96", // Secondary Text #606060
    "--color-secondary-600": "80 80 80",
    "--color-secondary-700": "64 64 64",
    "--color-secondary-800": "48 48 48",
    "--color-secondary-900": "32 32 32",
    "--color-secondary-950": "21 2 2",

    /* Tertiary - Disabled Text */
    "--color-tertiary-0": "255 255 255",
    "--color-tertiary-50": "245 245 245",
    "--color-tertiary-100": "230 230 230",
    "--color-tertiary-200": "200 200 200",
    "--color-tertiary-300": "170 170 170",
    "--color-tertiary-400": "142 142 142",
    "--color-tertiary-500": "142 142 142", // Disabled Text #8E8E8E
    "--color-tertiary-600": "120 120 120",
    "--color-tertiary-700": "100 100 100",
    "--color-tertiary-800": "80 80 80",
    "--color-tertiary-900": "60 60 60",
    "--color-tertiary-950": "40 40 40",

    /* Error - Coral Red (Failed actions, critical alerts) */
    "--color-error-0": "254 226 226",
    "--color-error-50": "254 202 202",
    "--color-error-100": "252 165 165",
    "--color-error-200": "248 113 113",
    "--color-error-300": "239 68 68",
    "--color-error-400": "220 53 69",
    "--color-error-500": "220 53 69", // Error #DC3545
    "--color-error-600": "185 28 28",
    "--color-error-700": "153 27 27",
    "--color-error-800": "127 29 29",
    "--color-error-900": "100 20 20",
    "--color-error-950": "83 19 19",

    /* Success - Liberty Green (Report submitted successfully) */
    "--color-success-0": "228 255 244",
    "--color-success-50": "202 255 232",
    "--color-success-100": "162 241 192",
    "--color-success-200": "132 211 162",
    "--color-success-300": "72 151 102",
    "--color-success-400": "25 135 84",
    "--color-success-500": "25 135 84", // Success #198754
    "--color-success-600": "20 108 67",
    "--color-success-700": "16 86 54",
    "--color-success-800": "12 65 40",
    "--color-success-900": "10 54 33",
    "--color-success-950": "27 50 36",

    /* Warning - Mustard Yellow (Pending reviews, caution messages) */
    "--color-warning-0": "255 252 245",
    "--color-warning-50": "255 248 232",
    "--color-warning-100": "255 243 205",
    "--color-warning-200": "255 229 153",
    "--color-warning-300": "255 214 102",
    "--color-warning-400": "255 200 51",
    "--color-warning-500": "255 193 7", // Warning #FFC107
    "--color-warning-600": "230 173 6",
    "--color-warning-700": "204 154 6",
    "--color-warning-800": "179 134 5",
    "--color-warning-900": "153 115 5",
    "--color-warning-950": "128 96 4",

    /* Info - Blue (Information messages, hyperlinks) */
    "--color-info-0": "227 242 253",
    "--color-info-50": "199 235 252",
    "--color-info-100": "162 221 250",
    "--color-info-200": "124 207 248",
    "--color-info-300": "87 194 246",
    "--color-info-400": "50 180 244",
    "--color-info-500": "13 110 253", // Info #0D6EFD
    "--color-info-600": "10 88 202",
    "--color-info-700": "8 70 161",
    "--color-info-800": "6 53 121",
    "--color-info-900": "5 44 100",
    "--color-info-950": "3 38 56",

    /* Typography */
    "--color-typography-0": "255 255 255",
    "--color-typography-50": "248 249 250",
    "--color-typography-100": "235 234 234",
    "--color-typography-200": "200 200 200",
    "--color-typography-300": "170 170 170",
    "--color-typography-400": "142 142 142",
    "--color-typography-500": "96 96 96",
    "--color-typography-600": "80 80 80",
    "--color-typography-700": "64 64 64",
    "--color-typography-800": "48 48 48",
    "--color-typography-900": "21 2 2",
    "--color-typography-950": "21 2 2",
    "--color-typography-white": "255 255 255",
    "--color-typography-gray": "212 212 212",
    "--color-typography-black": "21 2 2",

    /* Outline */
    "--color-outline-0": "255 255 255",
    "--color-outline-50": "248 249 250",
    "--color-outline-100": "235 234 234",
    "--color-outline-200": "200 200 200",
    "--color-outline-300": "170 170 170",
    "--color-outline-400": "142 142 142",
    "--color-outline-500": "96 96 96",
    "--color-outline-600": "80 80 80",
    "--color-outline-700": "64 64 64",
    "--color-outline-800": "48 48 48",
    "--color-outline-900": "32 32 32",
    "--color-outline-950": "21 2 2",

    /* Background */
    "--color-background-0": "255 255 255", // Primary Background #FFFFFF
    "--color-background-50": "248 249 250", // Surface #F8F9FA
    "--color-background-100": "235 234 234", // Secondary Background #EBEAEA
    "--color-background-200": "220 220 220",
    "--color-background-300": "200 200 200",
    "--color-background-400": "170 170 170",
    "--color-background-500": "142 142 142",
    "--color-background-600": "115 115 115",
    "--color-background-700": "90 90 90",
    "--color-background-800": "70 70 70",
    "--color-background-900": "50 50 50",
    "--color-background-950": "30 30 30",

    /* Background Special */
    "--color-background-error": "254 226 226", // Red background #FEE2E2
    "--color-background-warning": "255 248 225", // Yellow background #FFF8E1
    "--color-background-success": "232 245 233", // Green background #E8F5E9
    "--color-background-muted": "248 249 250",
    "--color-background-info": "227 242 253", // Blue background #E3F2FD

    /* Issue Type Colors */
    "--color-issue-jal": "13 202 240", // Cyan #0DCAF0 (Water)
    "--color-issue-bijli": "255 193 7", // Yellow #FFC107 (Electricity)
    "--color-issue-sadak": "96 96 96", // Grey #606060 (Roads)
    "--color-issue-kachra": "25 135 84", // Green #198754 (Garbage)
    "--color-issue-severage": "139 69 19", // Brown #8B4513 (Sewerage)

    /* Report Status Colors */
    "--color-status-reported": "220 53 69", // Red #DC3545
    "--color-status-reported-bg": "254 226 226", // #FEE2E2
    "--color-status-parshad": "255 193 7", // Yellow #FFC107
    "--color-status-parshad-bg": "255 248 225", // #FFF8E1
    "--color-status-started": "25 135 84", // Green #198754
    "--color-status-started-bg": "232 245 233", // #E8F5E9
    "--color-status-finished": "13 110 253", // Blue #0D6EFD
    "--color-status-finished-bg": "227 242 253", // #E3F2FD

    /* Focus Ring Indicator */
    "--color-indicator-primary": "21 2 2",
    "--color-indicator-info": "13 110 253",
    "--color-indicator-error": "220 53 69",
    "--color-indicator-brand": "4 106 56", // Uttarakhand Green for brand focus
  }),
  dark: vars({
    /* Brand Colors - Uttarakhand Green (Primary action color) */
    "--color-brand-0": "1 21 12",
    "--color-brand-50": "2 32 18",
    "--color-brand-100": "2 42 23",
    "--color-brand-200": "3 58 31",
    "--color-brand-300": "3 74 40", // Uttarakhand Green Dark
    "--color-brand-400": "4 106 56", // Uttarakhand Green
    "--color-brand-500": "4 106 56",
    "--color-brand-600": "25 135 84", // Uttarakhand Green Light
    "--color-brand-700": "72 151 102",
    "--color-brand-800": "132 211 162",
    "--color-brand-900": "162 241 192",
    "--color-brand-950": "202 255 232",

    /* Primary Text Colors - White on dark backgrounds */
    "--color-primary-0": "5 0 0",
    "--color-primary-50": "8 0 0",
    "--color-primary-100": "10 1 1",
    "--color-primary-200": "13 1 1",
    "--color-primary-300": "17 1 1",
    "--color-primary-400": "96 96 96",
    "--color-primary-500": "255 255 255", // Text on dark
    "--color-primary-600": "248 249 250",
    "--color-primary-700": "235 234 234",
    "--color-primary-800": "220 220 220",
    "--color-primary-900": "200 200 200",
    "--color-primary-950": "180 180 180",

    /* Secondary Text */
    "--color-secondary-0": "21 2 2",
    "--color-secondary-50": "32 32 32",
    "--color-secondary-100": "48 48 48",
    "--color-secondary-200": "64 64 64",
    "--color-secondary-300": "80 80 80",
    "--color-secondary-400": "142 142 142",
    "--color-secondary-500": "170 170 170",
    "--color-secondary-600": "200 200 200",
    "--color-secondary-700": "220 220 220",
    "--color-secondary-800": "235 234 234",
    "--color-secondary-900": "248 248 248",
    "--color-secondary-950": "255 255 255",

    /* Tertiary - Disabled Text */
    "--color-tertiary-0": "40 40 40",
    "--color-tertiary-50": "60 60 60",
    "--color-tertiary-100": "80 80 80",
    "--color-tertiary-200": "100 100 100",
    "--color-tertiary-300": "120 120 120",
    "--color-tertiary-400": "142 142 142",
    "--color-tertiary-500": "142 142 142", // Disabled Text
    "--color-tertiary-600": "170 170 170",
    "--color-tertiary-700": "200 200 200",
    "--color-tertiary-800": "230 230 230",
    "--color-tertiary-900": "245 245 245",
    "--color-tertiary-950": "255 255 255",

    /* Error - Coral Red */
    "--color-error-0": "83 19 19",
    "--color-error-50": "100 20 20",
    "--color-error-100": "127 29 29",
    "--color-error-200": "153 27 27",
    "--color-error-300": "185 28 28",
    "--color-error-400": "220 53 69",
    "--color-error-500": "220 53 69", // Error
    "--color-error-600": "239 68 68",
    "--color-error-700": "248 113 113",
    "--color-error-800": "252 165 165",
    "--color-error-900": "254 202 202",
    "--color-error-950": "254 226 226",

    /* Success - Liberty Green */
    "--color-success-0": "27 50 36",
    "--color-success-50": "10 54 33",
    "--color-success-100": "12 65 40",
    "--color-success-200": "16 86 54",
    "--color-success-300": "20 108 67",
    "--color-success-400": "25 135 84",
    "--color-success-500": "25 135 84", // Success
    "--color-success-600": "72 151 102",
    "--color-success-700": "132 211 162",
    "--color-success-800": "162 241 192",
    "--color-success-900": "202 255 232",
    "--color-success-950": "228 255 244",

    /* Warning - Mustard Yellow */
    "--color-warning-0": "128 96 4",
    "--color-warning-50": "153 115 5",
    "--color-warning-100": "179 134 5",
    "--color-warning-200": "204 154 6",
    "--color-warning-300": "230 173 6",
    "--color-warning-400": "255 193 7",
    "--color-warning-500": "255 193 7", // Warning
    "--color-warning-600": "255 200 51",
    "--color-warning-700": "255 214 102",
    "--color-warning-800": "255 229 153",
    "--color-warning-900": "255 243 205",
    "--color-warning-950": "255 252 245",

    /* Info - Blue */
    "--color-info-0": "3 38 56",
    "--color-info-50": "5 44 100",
    "--color-info-100": "6 53 121",
    "--color-info-200": "8 70 161",
    "--color-info-300": "10 88 202",
    "--color-info-400": "13 110 253",
    "--color-info-500": "13 110 253", // Info
    "--color-info-600": "50 180 244",
    "--color-info-700": "87 194 246",
    "--color-info-800": "124 207 248",
    "--color-info-900": "199 235 252",
    "--color-info-950": "227 242 253",

    /* Typography */
    "--color-typography-0": "21 2 2",
    "--color-typography-50": "48 48 48",
    "--color-typography-100": "64 64 64",
    "--color-typography-200": "80 80 80",
    "--color-typography-300": "115 115 115",
    "--color-typography-400": "140 140 140",
    "--color-typography-500": "170 170 170",
    "--color-typography-600": "200 200 200",
    "--color-typography-700": "220 220 220",
    "--color-typography-800": "235 234 234",
    "--color-typography-900": "248 249 250",
    "--color-typography-950": "255 255 255",
    "--color-typography-white": "255 255 255",
    "--color-typography-gray": "96 96 96",
    "--color-typography-black": "21 2 2",

    /* Outline */
    "--color-outline-0": "21 2 2",
    "--color-outline-50": "32 32 32",
    "--color-outline-100": "48 48 48",
    "--color-outline-200": "64 64 64",
    "--color-outline-300": "80 80 80",
    "--color-outline-400": "96 96 96",
    "--color-outline-500": "115 115 115",
    "--color-outline-600": "140 140 140",
    "--color-outline-700": "170 170 170",
    "--color-outline-800": "200 200 200",
    "--color-outline-900": "220 220 220",
    "--color-outline-950": "235 234 234",

    /* Background */
    "--color-background-0": "18 18 18", // Dark background
    "--color-background-50": "30 30 30",
    "--color-background-100": "40 40 40",
    "--color-background-200": "50 50 50",
    "--color-background-300": "70 70 70",
    "--color-background-400": "90 90 90",
    "--color-background-500": "115 115 115",
    "--color-background-600": "140 140 140",
    "--color-background-700": "170 170 170",
    "--color-background-800": "200 200 200",
    "--color-background-900": "235 234 234",
    "--color-background-950": "248 249 250",

    /* Background Special */
    "--color-background-error": "83 19 19",
    "--color-background-warning": "128 96 4",
    "--color-background-success": "27 50 36",
    "--color-background-muted": "30 30 30",
    "--color-background-info": "3 38 56",

    /* Issue Type Colors - Same for both modes */
    "--color-issue-jal": "13 202 240",
    "--color-issue-bijli": "255 193 7",
    "--color-issue-sadak": "96 96 96",
    "--color-issue-kachra": "25 135 84",
    "--color-issue-severage": "139 69 19",

    /* Report Status Colors - Same for both modes */
    "--color-status-reported": "220 53 69",
    "--color-status-reported-bg": "83 19 19",
    "--color-status-parshad": "255 193 7",
    "--color-status-parshad-bg": "128 96 4",
    "--color-status-started": "25 135 84",
    "--color-status-started-bg": "27 50 36",
    "--color-status-finished": "13 110 253",
    "--color-status-finished-bg": "3 38 56",

    /* Focus Ring Indicator */
    "--color-indicator-primary": "255 255 255",
    "--color-indicator-info": "13 110 253",
    "--color-indicator-error": "220 53 69",
    "--color-indicator-brand": "4 106 56", // Uttarakhand Green for brand focus
  }),
};
