import React from "react";
import "../App.css";

const CoursePage = (props) => {
  return (
    <div className="coursePage">
      {props.course && (
        <div>
          <h2>{props.course.id}</h2>
          <p>{props.course.name}</p>
          <p>{props.course.description}</p>
        </div>
      )}
    </div>
  );
};

export default CoursePage;
