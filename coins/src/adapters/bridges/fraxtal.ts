import { Token } from "./index";
import { getApi } from "../utils/sdk";

export default async function bridge(): Promise<Token[]> {
  const api = await getApi('fraxtal')
  const l2Tokens = [
    '0x8e9C334afc76106F08E0383907F4Fca9bB10BA3e',
    '0xa71bB8c79dc8FfA90A6Dd711aA9Fbe5114c19cba',
    '0x2611aD9D69f2d85734810c2d1A8e979DD6b6C81C',
    '0x758094A71a39De49626FE25B86631ED944558653',
    '0xa57947cb0e22973B488012115ED1034214A06344',
    '0xE9767f81A58D4576908E44973A90476170B39aFc',
    '0x3fACF94D4242fD9526A6216ea9c10842BD1f307a',
    '0xB102f7Efa0d5dE071A8D37B3548e1C7CB148Caf3',
    '0x124189d975bD59f85a0bE1845b556D9249096522',
    '0x7F3a9Afc827AeEdb0c5dC1A66C0Baa41cD7289F0',
    '0x8FeDf28A1b00AF7Bf9232B7f8fcA1fF1e7ed43b7',
    '0xf6a011fAC307f55Cd4bA8e43b8b93f39808DdaA9',
    '0x66E302F0935a9642c6c2Aae417F9AEeeC6A55186',
    '0xBD4f4190D5B53f178604e722BBe23d8C9571304E',
    '0x682ed69AB65e17cf2616b9502a61E87A8c0143F2',
    '0xA8a59D73388D0c4344a7b0Ba287ddb654227c38a',
    '0x2f7A0add6805a805a2104b1CAeE79ed46D7a67F0',
    '0x8c6bF92B92289dE338a167B789a684103722D1A3',
    '0xf4df4E63Bf95896DB72254408C446396F791eEed',
    '0x427510f99412Dc189c1119cfA73C50400ba964BC',
    '0xfb1520DbDc9230ef5dD5e6fd3Bbb6647B570E190',
    '0x1Bea449b76f0F09cA98c7A95c86F7BF0fB66c74F',
    '0xacc45B40d9a33AB51485293c3f239b1984Eb68ed',
    '0x908AfaF175021748366A78d73DDb93F9b191211F',
    '0xF8D6E77E3127cB515903810911c4Be88708Cf438',
    '0xB0c9aA731260D44f4905DA5293a9CC90680d9A5F',
    '0x3795DD50bB66354843A52783B7232Ea800ec79f4',
    '0x873fe38A08D485088f223B6439432B3096cf7010',
    '0x2D114997AF7E72f69c1edC02288616d88aFdC24D',
    '0x20676A21aF76a341D7188461D435197923ae8b86',
    '0x9A1306F7006ef0e18084aBBeda5C0e14D4D40b2C',
    '0x856d44A73EeAc48C53DcA04851915FDCB8218281',
    '0x0040f96E480EEf9fF565c320BE2BC67a02daA102',
    '0x2FC7447F6cF71f9aa9E7FF8814B37E55b268Ec91',
    '0x8B88b0EE370564bCf205a2036da1C71AE8cB3157',
    '0x7f13afF567Bd263134D798A93Ce86a12fc0bA3Dd',
    '0xADa508296cF34548435B833aA5F790549Ac1bC63',
    '0x15b38Be3a2082A1d61C581B1Fa1C7A95921F39ce',
    '0x4154132136406e2F4C419ff3fd81beEA0eA78B1a',
    '0x748e54072189Ec8540cD58A078404ebFDc2aACeA',
    '0x54B45d47aa7B964f7d4cB8e34354241028B7D88F',
    '0x73860A08F09C9B274cacdDC107830DAE3b023Abd',
    '0xB4E6C27aD15307adf302166789eCc030E3C1AbCD',
    '0x3E3807947df5dA614f4a18f4eD3F87cb59430586',
    '0x2B2A8d8ED996A2974807AcB27e14882F8E815273',
    '0xb3a7862d7B29B8E3D235299128C6985E2CD44c33',
    '0x7aED886e6439507c1fE6B85b55f1ce43Fa050521',
    '0x678A904FD5449322795f199Ce6D03c3E8b981641',
    '0xC0aD5421766936CC8243c3a96cCB2292825BB5bb',
    '0xB98C142d1773dBca3D85711992B629a7dd178dd5',
    '0x9D58FFF6b85EC1ef87BFe487765bF3aeB170dB00',
    '0x584307F6A6D030260b8FF0b08c02Ba37a141AE73',
    '0x2314ca58ad8c6740Df3a82a1C683245149ACE552',
    '0xdB43E8C63780dac7186eeE65d05dA0413Fa3159b',
    '0x5F5fC9d6b5DaA9AAf121FeABb24755b07b609738',
    '0x093b5f5DAed10e3dB7644fBFDAa99A8b7Dfe61AF',
    '0x62c79b98d518882FA0a6EDB257AE20cfedCb465f',
    '0x577CfdAd0Aa8a04fB2Ee57a2c0C8B0f1b2aaff7b',
    '0xB2aB159eCc808cE5822c2cA334EFa671f15d12C1',
    '0xcEE241e837A36664b4a3Ac5B90B0E8630Ef33CA4',
    '0xBA1AD764dc93924AFA55ed78a9878990b8A43191',
    '0x999d00801C88E980C6605137EA660606E0494cE5',
    '0xD6F681e7Cd16a62C97FccD9b4bb12Eb2Dcc77Af7',
    '0x29571800353195D5D4F3c75cb48bb645236A497B',
    '0x3e726075545Ca68F412f9171B59cDf6DE471c52c',
    '0xcAB53c54b1F604261116Ea5de22E20D256470c28',
    '0xC9F8A18AC103E13a669038ad5E21661FCcD13cCb',
    '0x9af1bd8A8935f584153E1B5A0b0F94a60ce3FecA',
    '0xbFb8BE1B1942D9673175f9D1236787b32588b610',
    '0xf4Fee0A3aa10abD90b2E03Cf9aB4C221d8348157',
    '0x09eAdcBAa812A4C076c3a6cDe765DC4a22E0d775',
    '0x269005f33E78d75dD222D3691B5Fe48E8aB20E99',
    '0x6629b251782eD3b5d3b0778Ac2C41c599f94d3a3',
    '0xea54c3c7F7DE417D61840AdbA31A2feF36C3DaE4',
    '0xC514F324E14682Fc7e6931aD05D293c126425152',
    '0x47996fc74995437e9cf65d6d332D7e3BBD5a0924',
  ]
  const decimals = await api.multiCall({  abi: 'erc20:decimals', calls: l2Tokens})
  const symbols = await api.multiCall({  abi: 'erc20:symbol', calls: l2Tokens})
  const l1Tokens = await api.multiCall({  abi: 'address:l1Token', calls: l2Tokens})

  const tokens: Token[] = [];
  l2Tokens
    .map((token, idx) => {
      tokens.push({
        from: `fraxtal:${token}`,
        to: `ethereum:${l1Tokens[idx]}`,
        symbol: symbols[idx],
        decimals: decimals[idx],
      });
    });
  const response =  [tokens]

  return response.flat()
}
