import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { blackScholes } from "black-scholes";
import iv from "implied-volatility";


const MetricsComputations = () => {

const computeXandYAxis = async (data) => {

  let x_axis = null;
  let metrics = null;
  let index;
  if (data?.["ltp"]){
    let resp = formXaxis(data?.["step"], data?.["ltp"]);
    index = resp?.low;
    x_axis = resp?.newArray;
  }
  function processData(x_axis, data) {
    return formYaxis(x_axis, data?.["selectedData"], data["lotsVal"], data?.["ltp"]).then((response) => {
      metrics = response;
      metrics["x_axis"] = x_axis;
      metrics["ltpIndex"] = index;
      return metrics;
    })
    .catch((error) => {
      return processData(x_axis, data);
    });
  }

  if (x_axis && data?.["selectedData"].length > 0){
    return processData(x_axis, data)
    .then((metrics) => {
      return metrics;
    })
    .catch((error) => {
      console.log(error);
    });
  }
  
}

const formXaxis = (step, ltp) => {
  // let step = parseFloat(symbol?.step);
  let valuesArray = [];

  // if (!step){
    let x_axis = [];
    let start = 95; 
    let stop = 106; 
    step = 0.1; 
    for (var i = start; i < stop; i += step) {
      let n = Math.round((ltp * i) / 100, 2);
      x_axis.push(Number(n));
    }
    valuesArray = x_axis;
  // } else {
  //   const roundedValue = Math.round(ltp / step) * step;
  //   const lowerBound = roundedValue - roundedValue * 0.08;
  //   const upperBound = roundedValue + roundedValue * 0.08;
  //   for (let value = lowerBound; value <= upperBound; value += step) {
  //     let step_rounded = Math.floor(value / step) * step;
  //     valuesArray.push(step_rounded);
  //   }
  // }    
  let newArray = [...valuesArray];
  let low = 0;
  let high = valuesArray.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (valuesArray[mid] === ltp) {
      // If the element already exists, you can handle it as needed
      return;
    } else if (valuesArray[mid] < ltp) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  // newArray.splice(low, 0, parseFloat(ltp));

  return {newArray, low};

};

function computeIV(optionPrice, spot, strike, timeToExpiration, optionType) {
  const riskFreeRate = 0.1 / 365; //moved this out of the loop
  const initialGuessIv = iv.getImpliedVolatility(
    optionPrice,
    spot,
    strike,
    timeToExpiration,
    riskFreeRate,
    optionType
  );
  return initialGuessIv;
}

function computeTargetLine(
  option_price,
  x_axis,
  spot,
  row,
  timeToExpiration,
  annualizedDaysCount,
  optionType
) {
  const riskFreeRate = 0.1 / 365;
  let targetPrices = [];
  let rowIv = computeIV(
    parseFloat(option_price),
    parseFloat(spot),
    row?.strike,
    annualizedDaysCount,
    optionType
  ).toFixed(2);
  if (parseInt(rowIv) > 1) {
    rowIv = rowIv / 100;
  }
  for (let val = 0; val < x_axis?.length; val++) {
    const optionPrice = blackScholes(
      x_axis[val],
      row?.strike,
      timeToExpiration,
      rowIv,
      riskFreeRate,
      optionType
    );
    targetPrices.push(optionPrice);
  }
  return targetPrices;
}

const formYaxis = (x_axis, selectedData, lotsVal, ltp) => {
  let checkedarrays = [];
  let g = [];
  let calculatedMaxProfit;
  let calculatedMaxLoss;
  let calculatedRiskReward;

  let nearest_expirydate;
  if (selectedData[0].hasOwnProperty("expiry")) {
    nearest_expirydate = new Date(selectedData[0]?.expiry);
  } else {
    nearest_expirydate = new Date(selectedData[0]?.expiry_date);
  }
  let leastdate = nearest_expirydate;
  let ddate;

  selectedData.map((obj, i) => {
    checkedarrays.push(obj);
    if (obj.hasOwnProperty("expiry")) {
      ddate = new Date(obj?.expiry);
    } else {
      ddate = new Date(obj?.expiry_date);
    }
    leastdate = new Date(Math.min(ddate, leastdate));
  });

  let h = [];

  let premium = 0;
  lotsVal = parseInt(lotsVal);
  
  checkedarrays.map((obj) => {
    let strike = Number(obj.strike);
    let option_price = obj.price
      ? obj.price
      : 70;
    if (!option_price){
      option_price = obj?.average_prc;
    }
    let option_type = obj.isCALL ? "call" : "put";
    let y = [];
    if (!lotsVal){
      lotsVal = parseInt(obj?.lotSize) / parseInt(obj?.net_quantity);
    }
    let option_lot = lotsVal * Number(obj.lotSize);

    let price = obj.isBuy
      ? -(option_price * option_lot)
      : option_price * option_lot;
    premium = premium + price;

    let expiry = obj.hasOwnProperty("expiry") ? obj?.expiry : obj?.expiry_date
    const expiryDate = new Date(expiry);
    const currentDate = new Date();
    let annualizedDaysCount = (expiryDate - currentDate)/ (1000 * 60 * 60 * 24 * 365);
    let timeToExpiration = (new Date(expiry) - leastdate) / (1000 * 60 * 60 * 24 * 365);
    let line = computeTargetLine(
      option_price,
      x_axis,
      ltp,
      obj,
      timeToExpiration,
      annualizedDaysCount,
      option_type
    );
    if (obj?.isBuy) {
      y = line.map((item) => (item - option_price) * option_lot);
    } else {
      y = line.map((item) => (option_price - item) * option_lot);
    }

    if (h.length == 0) {
      for (let i = 0; i < y.length; i++) {
        // g.push(Math.round(Number(y[i]), 2));
        g[i] = Math.round(y[i] * 100) / 100;
      }
    } else {
      for (let i = 0; i < y.length; i++) {
        let num = g[i] + Number(y[i]);
        g[i] = Math.round(num * 100) / 100;
      }
    }
    h = g;
    // Calculate maxProfit and maxLoss
    const maxProfit = Math.max(...h);
    const maxLoss = Math.min(...h);

    const maxProfitIndex = h.indexOf(maxProfit);
    if (
      maxProfitIndex === h.length - 1 &&
      h[maxProfitIndex] > h[maxProfitIndex - 1]
    ) {
      calculatedMaxProfit = "Unlimited";
    } else if (
      maxProfitIndex === 0 &&
      h[maxProfitIndex] > h[maxProfitIndex + 1]
    ) {
      calculatedMaxProfit = "Unlimited";
    } else {
      calculatedMaxProfit = maxProfit;
    }
    const maxLossIndex = h.indexOf(maxLoss);
    if (
      maxLossIndex === h.length - 1 &&
      h[maxLossIndex] < h[maxLossIndex - 1]
    ) {
      calculatedMaxLoss = "Unlimited";
    } else if (maxLossIndex === 0 && h[maxLossIndex] < h[maxLossIndex + 1]) {
      calculatedMaxLoss = "Unlimited";
    } else {
      calculatedMaxLoss = maxLoss;
    }

    if (
      calculatedMaxProfit === "Unlimited" ||
      calculatedMaxLoss === "Unlimited"
    ) {
      calculatedRiskReward = "N/A";
    } else {
      calculatedRiskReward = Math.abs(
        parseFloat(calculatedMaxProfit / calculatedMaxLoss).toFixed(2)
      );
      if (Math.abs(calculatedMaxProfit) > Math.abs(calculatedMaxLoss)) {
        calculatedRiskReward = calculatedRiskReward + ":1";
      } else {
        calculatedRiskReward = "1:" + calculatedRiskReward;
      }
    }
  });

  let breakevenRange = "";
  let strategyDirection = "Neutral";
  const indices = [];
  for (let i = 1; i < h.length; i++) {
    if ((h[i - 1] < 0 && h[i] >= 0) || (h[i - 1] >= 0 && h[i] < 0)) {
      indices.push(x_axis[i]);
    }
  }
  if (indices.length == 1) {
    if (h[h.length - 1] >= 0) {
      let percent_diff = parseFloat(((indices[0] - ltp) / ltp) * 100).toFixed(
        2
      );
      breakevenRange = indices[0] + "(" + percent_diff + "%) >";
      strategyDirection = "Bullish strategy";
    } else {
      let percent_diff = parseFloat(((indices[0] - ltp) / ltp) * 100).toFixed(
        2
      );
      breakevenRange = "< " + indices[0] + "(" + percent_diff + "%)";
      strategyDirection = "Bearish strategy";
    }
  }
  if (indices.length == 2) {
    if (h[h.length - 1] >= 0) {
      let percent_diff = parseFloat(((indices[1] - ltp) / ltp) * 100).toFixed(
        2
      );
      breakevenRange = indices[1] + "(" + percent_diff + "%) >";
      strategyDirection = "Neutral strategy";
    }
    if (h[0] > 0) {
      let percent_diff = parseFloat(((indices[0] - ltp) / ltp) * 100).toFixed(
        2
      );
      breakevenRange =
        "< " +
        indices[0] +
        "(" +
        percent_diff +
        "%)" +
        " & " +
        breakevenRange;
      strategyDirection = "Neutral strategy";
    }
    if (
      h[x_axis.indexOf(indices[0])] > 0 &&
      h[x_axis.indexOf(indices[0]) - 1] <= 0 &&
      h[x_axis.indexOf(indices[1]) - 1] >= 0 &&
      h[x_axis.indexOf(indices[1]) + 1] < 0
    ) {
      let percent_diff = parseFloat(((indices[0] - ltp) / ltp) * 100).toFixed(
        2
      );
      breakevenRange = indices[0] + "(" + percent_diff + "%)";
      percent_diff = parseFloat(((indices[1] - ltp) / ltp) * 100).toFixed(2);
      breakevenRange =
        breakevenRange +
        " < Spot < " +
        indices[1] +
        "(" +
        percent_diff +
        "%)";
      strategyDirection = "Neutral strategy";
    }
  }


  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (isNaN(h[0])) {
        reject(new Error('Data is null'));
      }
      resolve ({
        maxProfit: calculatedMaxProfit,
        maxLoss: calculatedMaxLoss,
        riskReward: calculatedRiskReward,
        breakevenRange: breakevenRange,
        strategyDirection: strategyDirection,
        premium: premium?.toFixed(2),
        y_axis: h
      });
    }, 100);
  });    
};

return {
  computeXandYAxis
}

}

export default MetricsComputations;