import { AdaptorsConfig } from "../types"



export default {
    "uniswap": {
        "enabled": true,
        "id": "1",
        parentId: "Uniswap",
        "protocolsData": {
            "v1": {
                "enabled": true,
                "id": "2196"
            },
            "v2": {
                "enabled": true,
                "id": "2197"
            },
            "v3": {
                "enabled": true,
                "id": "2198"
            },
        },
    },
    "pancakeswap": {
        "enabled": true,
        "id": "194",
        parentId: "PancakeSwap",
        protocolsData: {
            v1: {
                "disabled": true,
                enabled: true,
                "id": "2590"
            },
            v2: {
                enabled: true,
                "id": "194"
            },
            stableswap: {
                "enabled": true,
                "id": "2529"
            },
            v3: {
                "enabled": true,
                "id": "2769"
            }
        },
    },
    "smbswap": {
        "enabled": true,
        parentId: "SMBSwap",
        id: "1632",
        protocolsData: {
            v2: {
                enabled: true,
                "id": "1632"
            },
            v3: {
                "enabled": true,
                "id": "2895"
            }
        },
    },
    "arthswap-v3": {
        parentId: "ArthSwap",
        "enabled": true,
        "id": "4272",
    },
    "alienbase-v3": {
        parentId: "Alien Base",
        "enabled": true,
        "id": "3361",
    },
    "blasterswap": {
        "enabled": true,
        "id": "4296",
    },
    "cleopatra-v2": {
        parentId: "Cleopatra Exchange",
        "enabled": true,
        "id": "4286",
    },
    "moraswap-v3": {
        parentId: "Moraswap",
        "enabled": true,
        "id": "4269",
    },
    "infusion": {
        "enabled": true,
        "id": "4294",
    },
    "pharaoh-v2": {
        parentId: "Pharaoh Exchange",
        "enabled": true,
        "id": "4287"
    },
    "omax-swap": {
        "enabled": true,
        "id": "2464",
    },
    "kim-exchange-v2": {
        "enabled": true,
        "id": "4038",
        parentId: "KIM Exchange",
    },
    "swapmode-v2": {
        "enabled": true,
        "id": "4116",
    },
    "kim-exchange-v3": {
        "enabled": true,
        "id": "4299",
        parentId: "KIM Exchange",
    },
} as AdaptorsConfig
