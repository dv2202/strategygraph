import React from "react";

const PayoffSimulations = ({ data }) => {
  return (
    <>
    {
      data ?  (
        <div className="flex flex-col gap-[12px] "> 
        <h2 className="text-P300 text-[14px] font-gra font-semibold leading-[14px] -tracking-[1%]">
          Payoff Simulations
        </h2>
        <div className="w-full  flex p-[24px] bg-P400 rounded-md items-center justify-center drop-shadow-md">
          <div className="flex flex-row w-full h-fit items-center gap-[24px]">
            <div className="flex flex-col w-[141px] gap-2">
              <div className="flex flex-row gap-2 items-center pl-1">
                <div className="w-[4px] h-[4px] rounded-full bg-N400"></div>
                <h3 className="text-N400 text-[12px] font-medium leading-3 tracking-normal">Type</h3>
              </div>
              <p className="text-[14px] font-medium text-center w-full">
                {data?.["strategyDirection"]}
              </p>
            </div>
            <div className=" w-[0.9px] h-[38px] bg-N200"></div>
            <div className="flex flex-col w-[100px] gap-2">
              <div className="flex flex-row gap-2 items-center">
                <div className="w-[4px] h-[4px] rounded-full bg-N400"></div>
                <h3 className="text-N400 text-[12px] leading-3 font-medium">Max Profit</h3>
              </div>
              <p
                className={`text-[14px] font-medium w-full pl-[10px] leading-[14px] text-P150 `}
              >
                {data?.["maxProfit"]}
              </p>
            </div>
            <div className="  w-[0.9px] h-[38px]  bg-N200"></div>
            <div className="flex flex-col w-[93px] gap-2">
              <div className="flex flex-row gap-2 items-center">
                <div className="w-[4px] h-[4px] rounded-full bg-N400"></div>
                <h3 className="text-N400 text-[12px] leading-3 font-medium">Max Loss</h3>
              </div>
              <p className={`text-[14px] font-medium w-full ml-[10px] leading-[14px] text-Red `}>
                ₹{data?.["maxLoss"]}
              </p>
            </div>
            <div className="  w-[0.9px] h-[38px]  bg-N200"></div>
            <div className="flex flex-col w-[95px] gap-2">
              <div className="flex flex-row gap-2 items-center">
                <div className="w-[4px] h-[4px] rounded-full bg-N400"></div>
                <h3 className="text-N400 text-[12px] font-medium leading-3">
                  Risk / Reward
                </h3>
              </div>
              <p className={`text-[14px] font-medium w-full pl-[10px] leading-[14px] text-P300`}>
                {data?.["riskReward"] === "N/A"
                  ? "N/A"
                  : `${data?.["riskReward"]}%`}
              </p>
            </div>
            <div className="  w-[0.9px] h-[38px]  bg-N200"></div>
            <div className="flex flex-col w-[143px] gap-2">
              <div className="flex flex-row gap-2 items-center">
                <div className="w-[4px] h-[4px] rounded-full bg-N400"></div>
                <h3 className="text-N400 text-[12px] leading-3 font-medium">
                  Break even Point
                </h3>
              </div>
              <p className={`text-[14px] font-medium  leading-[14px] w-full pl-[10px] text-P300`}>
                {data?.["breakevenRange"]}
              </p>
            </div>
          </div>
        </div>
      </div>
      ) : (
        <div className="w-[834px] h-[86px] bg-N-100"></div>
      )
    }
    </>
  );
};

export default PayoffSimulations;
