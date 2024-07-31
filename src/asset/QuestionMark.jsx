import React from "react";
import { useLocation } from "react-router-dom";

const QuestionMark = ({ tooltipId }) => {
  const strokeColor = theme === "dark" ? "#FFFFFF" : "#555555";


  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        className="tooltip-question-mark ms-2"
        data-tooltip-id={tooltipId}
        style={{ stroke: strokeColor + " !important" }}>
        <path
          d="M6.99992 8.16667V7.71718C6.99992 7.13788 7.44483 6.65971 7.94099 6.36068C8.42 6.072 8.87738 5.55885 8.74992 4.66664C8.49992 2.91663 6.12492 3.79165 6.12492 3.79165M6.99992 9.91665V10.2083M13.4166 6.99998C13.4166 10.5438 10.5437 13.4166 6.99992 13.4166C3.45609 13.4166 0.583252 10.5438 0.583252 6.99998C0.583252 3.45615 3.45609 0.583313 6.99992 0.583313C10.5437 0.583313 13.4166 3.45615 13.4166 6.99998Z"
          stroke={strokeColor}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </>
  );
};

export default QuestionMark;
