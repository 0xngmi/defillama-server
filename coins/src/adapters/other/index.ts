import synthetixAdapter from "./synthetix";
import glp from "./glp";
import abraAdapter from "./abracadabra";
import unknownTokenAdapter from "./unknownToken";
import podsAdapter from "./pods";
import distressedAdapter, { contracts } from "./distressedAssets";
import manualInputAdapter from "./manualInput";
import realtAdapter from "./realt";
import metronomeAdapter from "./metronome";
import { contracts as metronomeContracts } from "./metronome";
import { wrappedGasTokens } from "../utils/gasTokens";
import collateralizedAdapter from "./collateralizedAssets";
import swethAdapter from "./sweth";
import gmdAdapter from "./gmd";
import stkaurabalAdapter from "./stkaurabal";
import shlb_ from "./shlb";
import axios from "axios";
import { Write } from "../utils/dbInterfaces";
import { addToDBWritesList } from "../utils/database";
import mooBvmAdapter from "./mooBvmEth";
import defiChainAdapter from "./defichain";
import velgAdapter from "./velgd";
export { glp };

export const shlb = shlb_;

export function defiChain(timestamp: number = 0) {
  console.log("starting defiChain");
  return defiChainAdapter(timestamp);
}
export function synthetix(timestamp: number = 0) {
  console.log("starting synthetix");
  return synthetixAdapter(timestamp);
}

export function metronome(timestamp: number = 0) {
  console.log("starting metronome");
  return Promise.all(
    Object.keys(metronomeContracts).map((chain) =>
      metronomeAdapter(chain, timestamp),
    ),
  );
}

export function abracadabra(timestamp: number = 0) {
  console.log("starting abracadabra");
  return abraAdapter(timestamp);
}
export function unknownTokens(timestamp: number = 0) {
  console.log("starting unknownTokens");
  return Promise.all([
    unknownTokenAdapter(
      timestamp,
      "0xe510c67dd0a54d06f04fd5af9094fe64ed605eab",
      "0xd51bfa777609213a653a2cd067c9a0132a2d316a",
      "0x76bf5e7d2bcb06b1444c0a2742780051d8d0e304",
      false,
      "beam",
      1.01,
    ),
    unknownTokenAdapter(
      timestamp,
      "0x09cabec1ead1c0ba254b09efb3ee13841712be14",
      "0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359",
      wrappedGasTokens["ethereum"],
      true,
      "ethereum",
    ),
    unknownTokenAdapter(
      timestamp,
      "0xcD15C231b8A0Bae40bD7938AE5eA8e43f1e9a15F",
      "0x0D94e59332732D18CF3a3D457A8886A2AE29eA1B",
      "0xC348F894d0E939FE72c467156E6d7DcbD6f16e21",
      false,
      "songbird",
    ),
    unknownTokenAdapter(
      timestamp,
      "0xa0feB3c81A36E885B6608DF7f0ff69dB97491b58",
      "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
      "0x20f663CEa80FaCE82ACDFA3aAE6862d246cE0333",
      false,
      "bsc",
    ),
    unknownTokenAdapter(
      timestamp,
      "0x604bd24343134066c16ffc3efce5d3ca160c1fee",
      "0x5b52bfb8062ce664d74bbcd4cd6dc7df53fd7233", //ZENIQ
      "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
      false,
      "bsc",
    ),
    unknownTokenAdapter(
      timestamp,
      "0x59b51516032241b796de4e495A90030C2d48BD1e",
      "0x9B377bd7Db130E8bD2f3641E0E161cB613DA93De", //stWEMIX
      "0x7D72b22a74A216Af4a002a1095C8C707d6eC1C5f",
      false,
      "wemix",
    ),
    unknownTokenAdapter(
      timestamp,
      "0xC597952437Fa67B4a28bb03B19BF786AD26A4036",
      "0x1702EC380e924B0E12d5C2e838B6b91A1fB3A052", //bSERO
      "0x55d398326f99059fF775485246999027B3197955",
      false,
      "bsc",
    ),
    unknownTokenAdapter(
      timestamp,
      "0xeAdff72aBdA0709CD795CEFa3A44f45a22440144",
      "0x1f88e9956c8f8f64c8d5fef5ed8a818e2237112c", //UCON
      "0x55d398326f99059fF775485246999027B3197955",
      false,
      "bsc",
    ),
    unknownTokenAdapter(
      timestamp,
      "0x4b4237b385bd6eaf3ef6b20dbcaed4158a688af7",
      "0xD86c0B9b686f78a7A5C3780f03e700dbbAd40e01",
      "0xdac17f958d2ee523a2206206994597c13d831ec7",
      false,
      "ethereum",
    ),
    unknownTokenAdapter(
      timestamp,
      "0xC977492506E6516102a5687154394Ed747A617ff",
      "0xEC13336bbd50790a00CDc0fEddF11287eaF92529", // gmUSD
      "0x4945970EfeEc98D393b4b979b9bE265A3aE28A8B",
      false,
      "arbitrum",
    ),
    unknownTokenAdapter(
      timestamp,
      "0x2071a39da7450d68e4f4902774203df208860da2",
      "0x3712871408a829c5cd4e86da1f4ce727efcd28f6", // GLCR
      "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7",
      false,
      "avax",
    ),
    unknownTokenAdapter(
      timestamp,
      "0x8a3EcB040d270ca92E122104e2d622b71c89E3cE",
      "0x09EF821c35B4577f856cA416377Bd2ddDBD3d0C9", // MMTH
      "0x152b9d0FdC40C096757F570A51E494bd4b943E50",
      false,
      "avax",
    ),
    unknownTokenAdapter(
      timestamp,
      "0xd3aC0C63feF0506699d68d833a10477137254aFf",
      "0x9A592B4539E22EeB8B2A3Df679d572C7712Ef999", //pxGMX
      "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
      false,
      "arbitrum",
    ),
    unknownTokenAdapter(
      timestamp,
      "0x0E8f117a563Be78Eb5A391A066d0d43Dd187a9E0",
      "0x07bb65faac502d4996532f834a1b7ba5dc32ff96", //FVM
      "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83",
      false,
      "fantom",
    ),
    unknownTokenAdapter(
      timestamp,
      "0xf3C45b45223Df6071a478851B9C17e0630fDf535",
      "0x1e925De1c68ef83bD98eE3E130eF14a50309C01B",
      "0x4200000000000000000000000000000000000006",
      false,
      "optimism",
    ),
    unknownTokenAdapter(
      timestamp,
      "0x53713F956A4DA3F08B55A390B20657eDF9E0897B",
      "0xd386a121991E51Eab5e3433Bf5B1cF4C8884b47a",
      "0x4200000000000000000000000000000000000006",
      false,
      "base",
    ),
    unknownTokenAdapter(
      timestamp,
      "0x9f8a222fd0b75239b32aa8a97c30669e5981db05",
      "0x999999999939ba65abb254339eec0b2a0dac80e9",
      "0xff3e7cf0c007f919807b32b30a4a9e7bd7bc4121",
      false,
      "klaytn",
    ),
    unknownTokenAdapter(
      timestamp,
      "0x357198ade95152e4fec8ad4d63981f45c4ab16c3",
      "0xcd91716ef98798a85e79048b78287b13ae6b99b2",
      "0xf417f5a458ec102b90352f697d6e2ac3a3d2851f",
      false,
      "manta",
    ),
  ]);
}
export function pods(timestamp: number = 0) {
  console.log("starting pods");
  return podsAdapter(timestamp);
}
export function distressed(timestamp: number = 0) {
  console.log("starting distressed");
  return Promise.all(
    Object.keys(contracts).map((chain: string) =>
      distressedAdapter(chain, timestamp),
    ),
  );
}
export function manualInput(timestamp: number = 0) {
  console.log("starting manualInputs");
  return Promise.all([
    manualInputAdapter("evmos", timestamp),
    manualInputAdapter("arbitrum", timestamp),
    manualInputAdapter("polygon", timestamp),
    manualInputAdapter("kava", timestamp),
    manualInputAdapter("polygon_zkevm", timestamp),
    manualInputAdapter("ethereum", timestamp),
  ]);
}
export function realt(timestamp: number = 0) {
  console.log("starting realt");
  return Promise.all([
    realtAdapter("ethereum", timestamp),
    realtAdapter("xdai", timestamp),
  ]);
}
export function collateralizedAssets(timestamp: number = 0) {
  console.log("starting collateralized assets");
  return collateralizedAdapter("arbitrum", timestamp, [
    {
      token: "0x52c64b8998eb7c80b6f526e99e29abdcc86b841b", // DSU
      vault: "0x0d49c416103cbd276d9c3cd96710db264e3a0c27",
      collateral: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
    },
  ]);
}
export function sweth(timestamp: number = 0) {
  console.log("starting sweth");
  return swethAdapter(timestamp);
}
export function gmd(timestamp: number = 0) {
  console.log("starting gmd");
  return gmdAdapter(timestamp);
}
export function stkaurabal(timestamp: number = 0) {
  console.log("starting stkaurabal");
  return stkaurabalAdapter(timestamp);
}

export async function buck(timestamp: number = 0) {
  console.log("starting buck");
  const THIRY_MINUTES = 1800;
  if (+timestamp !== 0 && timestamp < +new Date() / 1e3 - THIRY_MINUTES)
    throw new Error("Can't fetch historical data");
  const writes: Write[] = [];
  const {
    data: {
      result: {
        data: {
          content: {
            fields: { type_names, normalized_balances, coin_decimals },
          },
        },
      },
    },
  } = await axios.post("https://fullnode.mainnet.sui.io", {
    jsonrpc: "2.0",
    id: 1,
    method: "sui_getObject",
    params: [
      "0xeec6b5fb1ddbbe2eb1bdcd185a75a8e67f52a5295704dd73f3e447394775402b",
      {
        showContent: true,
      },
    ],
  });
  const usdt =
    "5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN";
  const buck =
    "ce7ff77a83ea0cb6fd39bd8748e2ec89a3f41e8efdc3f4eb123e0ca37b184db2::buck::BUCK";
  const usdtBal = normalized_balances[type_names.indexOf(usdt)];
  const buckBal = normalized_balances[type_names.indexOf(buck)];
  const buckDecimals = coin_decimals[type_names.indexOf(buck)];
  const usdtDecimals = coin_decimals[type_names.indexOf(usdt)];
  addToDBWritesList(
    writes,
    "sui",
    "0x" + buck,
    (usdtBal * 10 ** (buckDecimals - usdtDecimals)) / buckBal,
    buckDecimals,
    "BUCK",
    timestamp,
    "buck",
    0.9,
  );

  return writes;
}

export async function mooBvm(timestamp: number = 0) {
  console.log("starting moo bvm eth");
  return mooBvmAdapter(timestamp);
}

export async function velgd(timestamp: number = 0) {
  console.log("starting velgd");
  return velgAdapter(timestamp);
}
