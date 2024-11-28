import * as sdk from "@defillama/sdk";
import {FetchOptions, FetchResultV2, SimpleAdapter} from "../../adapters/types";
import { CHAIN } from "../../helpers/chains";
import { gql, request } from "graphql-request";
import { getUniqStartOfTodayTimestamp } from "../../helpers/getUniSubgraphVolume";
import { Chain } from "@defillama/sdk/build/general";
import { getBlock } from "../../helpers/getBlock";

interface IGraph {
  dailyTradeVolumeUSD: string;
  dayID: string;
}

interface IProtocol {
  totalTradeVolumeUSD: string;
}
interface IData {
  protocolDayData: IGraph;
  protocols: IProtocol[];
}

type TEndpoint = {
  [s: string | Chain]: string;
};

// Updated using studio
const endpoints: TEndpoint = {
  [CHAIN.BSC]:
    sdk.graph.modifyEndpoint('3jEHqbiN3BQn7pyMDzkDcBwm5EYFtpMpXaeryRDGPKA7'),
  [CHAIN.ARBITRUM]:
    sdk.graph.modifyEndpoint('5YPaz7z5iYgboKtoShdvZYPohUKtrDLibcLSLzaC424M'),
  [CHAIN.ETHEREUM]:
    sdk.graph.modifyEndpoint('CzchnYPzkEoc75nPMEN3ydtSdxZ5fqhQhCmCz3tvHn8V'),
  [CHAIN.SCROLL]:
      sdk.graph.modifyEndpoint('8RfP8c7r9WY2EBHopY52khqniHtzhTbEfj5hTF1esetS'),
  [CHAIN.AVAX]:
    sdk.graph.modifyEndpoint('CoQESay2omXqeXf2irxDoPnggR9ULC9SeM7jPeSNgEVT'),
  [CHAIN.BASE]:
      sdk.graph.modifyEndpoint('9VTwC8JsHkdgJPjG1RZC7v2trmpq57JKrY4Vj74rSHoM'),
  [CHAIN.OPTIMISM]:
    sdk.graph.modifyEndpoint('56EaG7Hfw4oPK6CaatX9vuhKFKqh7ztThEkJ7Ya1yh2t'),
};

const fetchVolume = (chain: Chain) => {
  return async (options: FetchOptions): Promise<FetchResultV2> => {
    const { startTimestamp} = options;
    const dayTimestamp = getUniqStartOfTodayTimestamp(
        new Date(startTimestamp * 1000)
    );
    const todaysBlock = await getBlock(dayTimestamp, chain, {});
    const dayID = dayTimestamp / 86400;
    const query = gql`
      {
          protocolDayData(id: "${dayID}") {
              dayID
              dailyTradeVolumeUSD
          },
          protocols(block: { number: ${todaysBlock} }) {
            totalTradeVolumeUSD
          }
      }`;
    const response: IData = await request(endpoints[chain], query);
    const dailyVolume =
      Number(response.protocolDayData.dailyTradeVolumeUSD) / 2;
    const totalTradeVolumeUSD =
      Number(response.protocols[0].totalTradeVolumeUSD) / 2;
    return {
      dailyVolume: dailyVolume ? `${dailyVolume}` : undefined,
      totalVolume: totalTradeVolumeUSD ? `${totalTradeVolumeUSD}` : undefined,
      timestamp: dayTimestamp,
    };
  };
};

const adapter: SimpleAdapter = {
  version: 2,
  adapter: {
    [CHAIN.BSC]: {
      fetch: fetchVolume(CHAIN.BSC),
      start: 1650243600,
    },
    [CHAIN.ARBITRUM]: {
      fetch: fetchVolume(CHAIN.ARBITRUM),
      start: 1679809928,
    },
    [CHAIN.ETHEREUM]: {
      fetch: fetchVolume(CHAIN.ETHEREUM),
      start: 1691290453,
    },
    [CHAIN.SCROLL]: {
      fetch: fetchVolume(CHAIN.SCROLL),
      start: 1697417581,
    },
    [CHAIN.AVAX]: {
      fetch: fetchVolume(CHAIN.AVAX),
      start: 1697493603,
    },
    [CHAIN.BASE]: {
      fetch: fetchVolume(CHAIN.BASE),
      start: 1697486905,
    },
    [CHAIN.OPTIMISM]: {
      fetch: fetchVolume(CHAIN.OPTIMISM),
      start: 1700173545,
    },
  },
};

export default adapter;
