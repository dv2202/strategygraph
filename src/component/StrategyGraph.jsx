import HighchartsReact from 'highcharts-react-official';
import React, { useState,useEffect } from 'react'
import Highcharts from "highcharts";
import { useLocation } from 'react-router-dom';
import iv from "implied-volatility";
import { HiOutlineQuestionMarkCircle } from "react-icons/hi2";
import { Tooltip as ReactTooltip } from "react-tooltip";
import { BsSlashLg } from "react-icons/bs";
import patternFill from "highcharts/modules/pattern-fill";
import { FiMinus } from "react-icons/fi";
import { FaPlus } from "react-icons/fa6";

patternFill(Highcharts);


const StrategyGraph = ({options,data,greeksData}) => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const ltp = params.get("ltp");
  const selectedData = JSON.parse(params.get("selectedData"));
  const atmIndex = JSON.parse(params.get("atmIndex"));
  const [selectedTab, setSelectedTab] = useState('Payoff');
  const tabs = ['Payoff','', '', ''];
  const [lotsValue, setLotsValue] = useState(1);
  const [calculatedIV, setCalculatedIV] = useState(0);
  const x_axis = data?.["x_axis"];
  const y_axis = data?.["y_axis"];
  const ltptoIV = params.get("ltptoIV");
  const theme = "light";
  const array = data?.["y_axis"];
  const [targetPnLLine, setTargetPnLLine] = useState(data?.["y_axis"]);
  const [linechart, setlineChart] = useState({
    xAxis: {
      tickInterval: 100,
      categories: x_axis,
      title: false,
      labels: {
        enabled: true,
        rotation: 0,
        style: {
          textOverflow: "none",
        },
        formatter: function () {
          let chartWidth = this.chart.plotWidth;
          let labelCount = this.axis.tickPositions.length;
          let labelWidth = chartWidth / labelCount;
          let showLabels = labelCount;

          // Adjust the number of labels to show based on label width
          if (labelWidth < 100) {
            // Adjust the threshold as needed
            showLabels = Math.ceil(chartWidth / 100); // Show 1 label per 50 pixels
          }

          // Show only every nth label to fit the available space
          let index = this.axis.tickPositions.indexOf(this.pos);
          if (index % Math.ceil(labelCount / showLabels) !== 0) {
            return ""; // Return an empty string to skip label
          }

          return this.value;
        },
      },
    },
    yAxis: {
      title: {
        enabled: false,
      },
    },
    plotOptions: {
      series: {
        stacking: "normal",
        fillOpacity: 0.4,
      },
    },
    series: [
      {
        name: "",
        color: "#D8FDE2",
        negativeColor: "#FFD9D7",
        showInLegend: false,
      },
    ],
    chart: {
      type: "area",
      height: 346,
      backgroundColor: "transparent",
    },
    title: {
      text: "",
    },
  });

  const customPattern = (color,borderColor) => {
    return {
      pattern: {
        path:
        {
          d: 'M 0 0 L 10 0 ', // Inner path
          stroke: color,
          strokeWidth: 2,
        },
      width: 10,
      height: 10,
      patternTransform: 'rotate(-50)',
      },
    };
  };

  function padLotsValue(value) {
    return value.toString().padStart(2, '0');
  }

//   const initialChartOptions = {
//   chart: {
//     marginTop: 80,
//     // Other chart options
//   },
//   // Other chart configurations
// };

  const [chartOptions, setChartOptions] = useState(linechart);


  <svg width="10" height="10" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="slantLines" patternUnits="userSpaceOnUse" width="10" height="10">
        <path d="M0 10 L10 0" stroke="grey" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#slantLines)" />
  </svg>
  function setAtmIndex() {
    let index = 0;
    try {
      if (atmIndex) {
          const targetDateTimeString = atmIndex.expiry_date + " 15:29:59"; // Target date and time
          const targetDateTime = new Date(targetDateTimeString);
          const currentDate = new Date();
          let timeToExpiration = Math.max(
            0,
            (targetDateTime - currentDate) / (24 * 60 * 60 * 365 * 1000) ||
              0.0002 / 365
          );
          let computedIv = (
            computeIV(
              ltptoIV,
              ltp,
              atmIndex?.strike,
              timeToExpiration,
              "call"
            ) * 100
          ).toFixed(2);
          setCalculatedIV(computedIv);
        }
      }
      catch (error) {
      console.log(error);
      console.log("Waiting for IV");
    }
  }

  const closestIndex = (band, x_axis) => {
    const index = x_axis?.reduce(
      (prevIndex, currentValue, currentIndex, arr) => {
        return Math.abs(currentValue - band) < Math.abs(arr[prevIndex] - band)
          ? currentIndex
          : prevIndex;
      },
      0
    );
    return index;
  };

  function computeTargetLine(
    spot,
    row,
    timeToExpiration,
    annualizedDaysCount,
    optionType
  ) {
    const riskFreeRate = 0.1 / 365;
    let targetPrices = [];
    let rowIv = computeIV(
      parseFloat(row?.price),
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

  const calculatePlotBandWidth = (
    days_to_expire,
    ltp,
    calculatedIV,
    x_axis
  ) => {
    if (
      calculatedIV === undefined ||
      calculatedIV === null ||
      calculatedIV === 0
    ) {
      return {
        lowerBand1: null,
      };
    }

    const width = parseFloat(
      ltp * (calculatedIV / 100) * Math.sqrt(days_to_expire / 365)
    );



    const lowerBand1 = parseFloat(ltp) - width;
    const upperBand1 = parseFloat(ltp) + width;
    const lowerBand2 = parseFloat(ltp) - width * 2;
    const upperBand2 = parseFloat(ltp) + width * 2;

    const lowerBand1Index = closestIndex(lowerBand1, x_axis);
    const upperBand1Index = closestIndex(upperBand1, x_axis);
    const lowerBand2Index = closestIndex(lowerBand2, x_axis);
    const upperBand2Index = closestIndex(upperBand2, x_axis);

    return {
      lowerBand1,
      upperBand1,
      lowerBand2,
      upperBand2,
      lowerBand1Index,
      upperBand1Index,
      lowerBand2Index,
      upperBand2Index,
    };
  };


  const updateChart = () => {
    const {
      lowerBand1,
      upperBand1,
      lowerBand2,
      upperBand2,
      lowerBand1Index,
      upperBand1Index,
      lowerBand2Index,
      upperBand2Index,
    } = calculatePlotBandWidth(lotsValue, ltp, calculatedIV, x_axis);

    if (!x_axis?.length || !y_axis?.length) {
      return; // Don't update chart with invalid data
    }

    if (((upperBand1 == upperBand2) == lowerBand1) == lowerBand2) {
      return;
    }

    setChartOptions((prevOptions) => ({
      ...prevOptions,
      chart: {
        marginTop: 20,
        events: {
          load() {
            const chart = this;
            const plotLineX = chart.xAxis[0].toPixels(data?.ltpIndex, true);
            const plotLineY1 = chart.yAxis[0].toPixels(chart.yAxis[0].min, true);
            const plotLineY2 = plotLineY1 - 80; // 80 pixels height
  
            // Draw the custom plot line
            chart.renderer
              .path(['M', plotLineX, plotLineY1, 'L', plotLineX, plotLineY2])
              .attr({
                'stroke-width': 2,
                stroke: '#0F0F0F',
                zIndex: 2,
              })
              .add();
          },
        },
      },
      series: [
        {
          type: "area",
          data: y_axis,
          name: "Profit/Loss",
          color: "#12B16E",
          opacity: 0.7,
          negativeColor: "#E94C69",
          lineWidth: 2,
          showInLegend: false,
          marker: {
            enabled: false,
          },
        },
        {
          type: "line",
          data: targetPnLLine,
          name: "Target P&L",
          color: "#0075FF",
          opacity: 1,
          negativeColor: "#0075FF",
          lineWidth: 2,
          showInLegend: false,
          marker: {
            enabled: false,
          },
        },
      ],
      yAxis: [
        {
          gridLineColor: "#EFEFEF",
          tickInterval: 100,
          gridLineWidth: 0,
          minorGridLineWidth: 0,
          labels: {
            formatter: function () {
              let chartWidth = this.chart.plotHeight;
              let labelCount = this.axis.tickPositions.length;
              let labelWidth = chartWidth / labelCount;
              let showLabels = labelCount;
      
              // Adjust the number of labels to show based on label width
              if (labelWidth < 50) {
                // Adjust the threshold as needed
                showLabels = Math.ceil(chartWidth / 50); // Show 1 label per 50 pixels
              }
              // Show only every nth label to fit the available space
              let index = this.axis.tickPositions.indexOf(this.pos);
              if (index % Math.ceil(labelCount / showLabels) !== 0) {
                return ""; // Return an empty string to skip label
              }
      
               return this.value.toLocaleString();;
            },
            style: {
              color: theme === "light" ? "#575757" : "#FFF",
              fontSize: "12px",
              fontWeight: "500",
              fontFamily: "Graphik, sans-serif",
            },
            x: -10,// Adding horizontal padding for y-axis labels
            y: 0,
          },
          
          plotLines: [
            {
              value: 0,
              width: 2,
              color: "#efefef",
            },
          ],
          title: {
            enabled: true,
            text: 'Profit / Loss',  // Adding the title here
            style: {
              color: theme === "light"  ? "#B7B7B7" : "#FFF",
              fontSize: "14px",
              fontWeight: "500",
            },
            x: -5,
            align: 'middle'  
          },
          opposite: false 
        },
        {
          labels: {
            style: {
              color: theme === "light" ? "#575757" : "#FFF",
              fontSize: "12px",
              fontWeight: "500",
            },
            x: 20 // Adding horizontal padding for the right y-axis labels
          },
          title: {
            text: 'Open Interest',  // Adding the title for the secondary axis
            style: {
              color: theme === "light"  ? "#B7B7B7" : "#FFF",
              fontSize: "14px",
              fontWeight: "500",
            
            },
            x:10,
            align: 'middle',
            rotation: 270,
          },
          opposite: true // This places the secondary y-axis on the right side
        }
      ]
      ,
      xAxis: {
        lineColor: "transparent",
        gridLineColor: "#EFEFEF",
        tickInterval: 10,
        allowDecimals: false,
        categories: x_axis.map((value) => value.toLocaleString("en-IN")),
        labels: {
          style: {
            color: theme === "light" ? "#575757" : "#FFF",
            fontSize: "12px",
            fontWeight: "500",
            fontFamily: "Graphik, sans-serif",
          },
          y: 20 ,
          x: 20
        },
        plotLines: [
          {
            color: '#0F0F0F',
            width: 2,
            value: data?.ltpIndex,
            zIndex: 2,
            label: {
              style: {
                fontWeight: 'bold',
                overflow: 'visible',
              },
              text: '',
              textAlign: 'center',
              rotation: 0,
              zIndex: 2,
              y:0,
            }, 
          },
        ],
        plotBands: [
          {
            color: customPattern('#CFCFCF'),
            from: lowerBand2Index,
            to: upperBand2Index,
            zIndex: 1,
            label: {
              text: "-2SD",
              align: "left",
              x: -10,
              y: -8,
              style: {
                color: theme === "light" ? "#red" : "#FFF",
                fontSize: "12px",
                fontWeight: "500",
                fontFamily: "Graphik, sans-serif",
              },
             
            },
            
          },
          {
            color: customPattern('#B7B7B7'),
            from: lowerBand1Index,
            to: upperBand1Index,
            zIndex: 1,
            position: "absolute",
            
            label: {
              text: "-1SD",
              align: "left",
              x: -10,
              y: -8,
              style: {
                color: theme === "light" ? "#575757" : "#FFF",
                fontSize: "12px",
                fontWeight: "500",
                fontFamily: "Graphik, sans-serif",
              },
            },
          },
          {
            color: customPattern('#B7B7B7'),
            from: lowerBand2Index,
            to: upperBand2Index,
            zIndex: 1,
            label: {
              text: "+2SD",
              align: "right",
              x: -1,
              y:-8,
              style: {
                color: theme === "light" ? "#575757" : "#FFF",
                fontSize: "12px",
                fontWeight: "500",
                fontFamily: "Graphik, sans-serif",
                overflow: "none",
              },
            },
          },
          {
            color: customPattern('#CFCFCF'),
            from: lowerBand1Index,
            to: upperBand1Index,
            zIndex: 1,
            label: {
              text: "+1SD",
              align: "right",
              x: 5,
              y:-8,
              style: {
                color: theme === "light" ? "#575757" : "#FFF",
                fontSize: "12px",
                fontWeight: "500",
                fontFamily: "Graphik, sans-serif",
              },
            },
          },
        ],
      },
    }));
  };

  function updateTargetLine(g, daysCount) {
    let xaxis_length = x_axis?.length;
    let targetLine = Array.from({ length: xaxis_length }, () => 0);
    for (let val = 0; val < selectedData.length; val++) {
      let optionType = selectedData[val]?.isCALL ? "call" : "put";
      let ddate;
      if (selectedData[val].hasOwnProperty("expiry")) {
        ddate = new Date(selectedData[val].expiry);
      } else {
        ddate = new Date(selectedData[val].expiry_date);
      }
      let date = new Date();
      date.setDate(date.getDate() + daysCount);
      let expiry_days = Math.round((ddate - date)/ (1000 * 60 * 60 * 24));
      expiry_days = expiry_days < 0 ? 0 : expiry_days;
      let timeToExpiration = Math.max(0, Math.abs(expiry_days + g) / 365 || 0.0002 / 365);
      let annualizedDaysCount = Math.max(0, (daysCount + expiry_days) / 365 || 0.0002 / 365);

      let line = computeTargetLine(
        ltp,
        selectedData[val],
        timeToExpiration,
        annualizedDaysCount,
        optionType
      );
      let updatedLine;
      let optionPrice = parseFloat(selectedData[val]?.price);
      let total_quantity =
        selectedData[val]?.lotSize * selectedData[val]?.lot_multiplier;
      if (selectedData[val]?.isBuy) {
        updatedLine = line.map((item) => (item - optionPrice) * total_quantity);
      } else {
        updatedLine = line.map((item) => (optionPrice - item) * total_quantity);
      }
      targetLine.map(
        (value, index) => (targetLine[index] += updatedLine[index])
      );

      let currentPriceIndex = 0;
      let minDiff = Math.abs(ltp - x_axis?.[0]);
      for (let i = 1; i < x_axis?.length; i++) {
        let diff = Math.abs(ltp - x_axis[i]);
        if (diff < minDiff) {
          minDiff = diff;
          currentPriceIndex = i;
        }
      }
      if (currentPriceIndex == -1) {
        currentPriceIndex = parseInt(x_axis.length / 2);
      }
      selectedData[val]["targetPrice"] = parseFloat(
        line[currentPriceIndex]
      ).toFixed(2);
    }
    const hasNaN = targetLine.some((value) => isNaN(value));
    if (!hasNaN) {
      setTargetPnLLine(targetLine);
    } else {
      setTargetPnLLine(data?.["y_axis"]);
    }
  }

  const handleDateClick = (event) => {
    let date = event.target.innerHTML;
    date = new Date(date);
    setDate(date);

    let exd = new Date(leastExpiry);
    let g = Math.round((exd - date) / (1000 * 60 * 60 * 24));
    setdaysleft(g);

    exd = new Date();
    let daysCount = Math.round((date - exd) / (1000 * 60 * 60 * 24) + 1);
    setdaysCount(daysCount);

    let finalExpiry = new Date(leastExpiry);
    let daysExpiry = Math.round(
      (finalExpiry - exd) / (1000 * 60 * 60 * 24) + 1
    );
    setDaysToExpiry(daysExpiry);
    // Computing target line

    updateTargetLine(g, daysExpiry);
    updateChart();
  };

  const decrementLots = () => {
    if (lotsValue > 1) {
      setLotsValue(lotsValue - 1);
    }
  };

  const incrementLots = () => {
    setLotsValue(lotsValue + 1);
  };
  useEffect(() => {
    if (y_axis?.length > 0) {
      setAtmIndex();
      updateChart();
    }
  }, [y_axis, calculatedIV, lotsValue, theme, targetPnLLine]);

  const handleTabClick = (tab) => {
    setSelectedTab(tab);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "";
    }
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayOfWeek = daysOfWeek[date.getDay()];
    const day = date.toLocaleDateString(undefined, { day: "2-digit" });
    const month = date.toLocaleDateString(undefined, { month: "short" });
    const year = date.toLocaleDateString(undefined, { year: "2-digit" });

    return `${dayOfWeek}, ${day} ${month} ${year}`;
  };

  return (
    <div className='font-medium gap-4 flex flex-col bg-N100 rounded-md border-1 bg-P400 pb-3 drop-shadow-md '>
      <div className="w-full items-center relative">
        <div className='pl-[24px] pr-[24px] h-[48px] flex flex-row justify-between items-center'>
        <div className="h-full flex flex-row gap-6 items-center ">
            {tabs.map((tab) => (
              <div
                key={tab}
                onClick={() => handleTabClick(tab)}
                className={`cursor-pointer h-full font-semibold text-center text-[12px] leading-[12px] flex flex-col -tracking-[1%] items-center justify-center ${selectedTab === tab ? 'text-black' : 'text-N-500'}`}
              >
                <p className="flex-grow content-center">{tab}</p>
                <div className={`w-full h-[2.5px] rounded-md z-30  ${selectedTab === tab ? 'bg-P150' : ''}`}></div>
              </div>
            ))}
          </div>
          <div className='flex flex-row gap-3'>
            <div className='flex flex-row items-center justify-center gap-2'>
              <div className='flex flex-row gap-[3px]'>
                <div className='bg-Red rounded-l-md w-[7px] h-[3px]'></div>
                <div className='bg-P150 rounded-r-md w-[7px] h-[3px]'></div>
              </div>
              <p className='text-black leading-[12px] text-[12px] font-medium'>Expiry</p>
            </div>
            <div className='flex flex-row items-center justify-center gap-2'>
              <div className='bg-Blue rounded-md w-[7px] h-[3px]'></div>
              <p className='text-black leading-[12px] text-[12px] font-medium'>Target Date</p>
            </div>
          </div>
        </div>
          
      <div className='w-full h-[2px] bg-N-100 absolute bottom-0'></div>
      </div>
      <div className='relative mt-[9px] flex items-center justify-center'>
      {selectedTab === "Payoff" && 
      (
      <div className='flex  flex-row z-[400] pl-[10px] pr-[10px] pt-[8px] pb-[8px] items-center justify-center text-[10px] font-medium leading-[10px] text-P300 border-N200 border-2 rounded-md absolute  top-[-17px] gap-1'>
        <div className='font-gra'>
          Current Price:
        </div>
        <div >
          {ltp}
        </div>
      </div>
      )
      }
      </div>
      <div className='w-[100%] '>
        <HighchartsReact highcharts={Highcharts} options={chartOptions} />
      </div>
      <div className='w-full h-[2px] bg-N-100 mt-1'></div>
      <div className='w-full h-fit flex flex-row pr-[24px] pl-[24px] items-center justify-between '>
        <div className='h-[16px] flex flex-row gap-[12px] items-center'>
          <div className='flex flex-row gap-[8px] h-full items-center'>
              <p className='text-[16px]  font-sans font-bold text-N-500'>δ</p>
              <p className='text-[14px] leading-[14px] font-medium'>{greeksData.delta}</p>
              <HiOutlineQuestionMarkCircle className='text-N400'/>
          </div>
          <p className='text-[16px] text-N-500'>/</p>
          <div className='flex flex-row h-full gap-[8px] items-center'>
              <p className='text-[16px]  font-sans font-bold text-N-500'>θ</p>
              <p className='text-[14px] leading-[14px] font-medium'>{greeksData.theta}</p>
              <HiOutlineQuestionMarkCircle className='text-N400'/>
          </div>
          <p className='text-[16px] text-N-500'>/</p>
          <div className='flex flex-row  h-full gap-[8px] items-center'>
              <p className='text-[16px]  font-sans font-bold text-N-500'>γ</p>
              <p className='text-[14px] leading-[14px] font-medium'>{greeksData.gamma}</p>
              <HiOutlineQuestionMarkCircle className='text-N400'/>
          </div>
          <p className='text-[16px] text-N-500'>/</p>
          <div className='flex flex-row  h-full gap-[8px] items-center'>
              <p className='text-[16px] font-sans font-bold text-N-500'>ν</p>
              <p className='text-[14px] leading-[14px] font-medium'>{greeksData.vega}</p>
              <HiOutlineQuestionMarkCircle className='text-N400'/>
          </div>
        </div>
        <div className="h-[32px] flex flex-row gap-[20px] items-center justify-center">
              <span className="text-N-500 text-[14px] leading-[14px] font-medium font-gra">Standard Deviation </span>
              <span>
                <div className="w-[123px] h-[32px] flex flex-row border-N-000 border-2 rounded-md  text-center items-center justify-between pr-[16px] pl-[16px] pt-[8px] pb-[8px]">
                  <div
                    role="button"
                    onClick={decrementLots} className='flex justify-center items-center h-[16px] w-[16px] '>
                    <FiMinus className='text-N-600 text-[14px] text-center'/>
                  </div>
                  <span className='text-[14px] font-semibold leading-[14px]'>{padLotsValue(lotsValue)}</span>
                  <div
                    role="button"
                    onClick={incrementLots}
                    className='flex justify-center items-center h-[16px] w-[16px] '
                    >
                    <FaPlus className='text-N-600 text-[14px] text-center'/>
                  </div>
                </div>
              </span>
        </div>
      </div>
      <ReactTooltip
        id="std-deviation"
        place="top"
        content="Helps determine the spread of asset prices from their average price."
        variant={theme === "dark" ? "light" : "dark"}
        className="mobile-tooltip"
      />
      <ReactTooltip
        id="total-est-pnl"
        place="top"
        content="Estimated P&L on selected target day"
        variant={theme === "dark" ? "light" : "dark"}
        className="mobile-tooltip"
      />
    </div>
  )
}

export default StrategyGraph
