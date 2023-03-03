// import { ethers } from "ethers";
// import { getABI, getProvider } from "../../utils/utils";


// getUserPoolPosition()

// export async function getUserPoolPosition() {
 
//   try {
//         let usdc = "0x95e3d2540479c67596575971b69b0c3951837359";
//         let weth = "0x1fe7250ca569bb07610596d2371f2e83fae3ea2b";
//         let chainId = "421613"
//         let provider = getProvider(chainId);
//         let ownerAddress = "0x95D2aefD060DB5Da61e31FfF7A855cc4c7ef6160";
//         let user1 = "0x103b62f68da23f20055c572269be67fa7635f2fc";
//         let aTokenAddress = "0xAfDaeEDd48E29AC664C106675336A3bDbAf97E79";
//         let aTokenAddressWeth = "0xA506d1DB0fAdA3BE4C813aA689114E09E1C31e45";
//         let vTokenAddress = "0x0bDD44EC2774C676B2DA5338Df5030420408935c"
//         let vTokenAddressWeth = "0x75d7Abd1778D22563A1611F53D0e3627F7E07368"
//         let Pool = new ethers.Contract("0xd4282DdAC1A8686695e00Ea9BB6cF542A3271CA4", getABI("IPool"), provider);
//         let aToken =  new ethers.Contract(aTokenAddressWeth, getABI("AToken"), provider);
//         let vToken  = new ethers.Contract(vTokenAddressWeth, getABI("VToken"), provider);
//         // console.log(pool);
//         console.log("getUserAccountData",await Pool.getReserveData(weth));
//         console.log(await aToken.balanceOf(user1));


//         // console.log("aToken", )
//     }
//     catch(error){
//         console.log(`Error @ getUserPoolPosition`, error)
//     }
// }