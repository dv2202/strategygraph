import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import MetricsComputations from "../src/component/MetricsComputations";
import '../src/index.css';
import StrategyGraph from "./component/StrategyGraph";
import PayoffSimulations from "./component/PayoffSimulations";


function App() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const ltp = params.get("ltp");
  const selectedData = JSON.parse(params.get("selectedData") || "[]");
  const lotsVal = params.get("lotsVal");
  const step = params.get("step");
  const metricsComputations = MetricsComputations();
  const [computedData, setComputedData] = useState({ x_axis: [], y_axis: [] });
  const [loading, setLoading] = useState(true); // Track loading state
  const greeksData = JSON.parse(params.get("greeksData") || "[]");
  const [sumGreeksValue, setSumGreeksValue] = useState({theta: 0, gamma: 0, delta: 0, vega: 0});


  useEffect(() => {
    let theta = 0;
    let gamma = 0;
    let delta = 0;
    let vega = 0;
  
    for(let i = 0 ; i < selectedData.length ; i++){
      let dateKey = selectedData[i].expiry;
      if (greeksData[dateKey]) {
        if (greeksData[dateKey]["call"]) {
          theta += parseInt(greeksData[dateKey]["call"].theta) || 0;
          gamma += parseInt(greeksData[dateKey]["call"].gamma) || 0;
          delta += parseInt(greeksData[dateKey]["call"].delta) || 0;
          vega += parseInt(greeksData[dateKey]["call"].vega) || 0;
        }
        if (greeksData[dateKey]["put"]) {
          theta += parseInt(greeksData[dateKey]["put"].theta) || 0;
          gamma += parseInt(greeksData[dateKey]["put"].gamma) || 0;
          delta += parseInt(greeksData[dateKey]["put"].delta) || 0;
          vega += parseInt(greeksData[dateKey]["put"].vega )|| 0;
        }
      }
    }
  
    setSumGreeksValue({
      theta,
      gamma,
      delta,
      vega
    });
  }, [greeksData]);
  


  useEffect(() => {
    const fetchData = async () => {
      try {
        const metrics = await metricsComputations.computeXandYAxis({
          selectedData: selectedData,
          ltp: ltp,
          step: step,
          lotsVal: lotsVal,
        });
        setComputedData(metrics);
        setLoading(false); 
      } catch (error) {
        console.error("Error:", error.message);
        setLoading(false); 
      }
    };

    if (selectedData?.length > 0) {
      fetchData();
    } else {
      setLoading(false); 
    }
  }, []);

  const options = {
    title: {
      text: "Metrics Chart",
    },
    xAxis: {
      categories: computedData?.x_axis || [],
    },
    series: [
      {
        name: "Profit/Loss",
        data: computedData?.y_axis || [],
      },
    ],
  };



  return (
        <div className="flex flex-col h-[700px] gap-[24px] bg-primary ">
          <PayoffSimulations data={computedData}/>
          <StrategyGraph 
            data={computedData}
            selectedData={selectedData}
            ltp={ltp}
            leastExpiry={selectedData[0]?.["expiry"]}
            options={options}
            greeksData={sumGreeksValue}
          />
        </div>
  );
}

export default App;
