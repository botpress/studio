import ReactDOM from "react-dom";

const InfoCard = (body: any, ev: any = "") => {
  return () => {
    let dom = document.createElement("div");
    ReactDOM.render(
      <div>
        <h1>{body}</h1>
        <h3>Evaluates to: {ev}</h3>
        <h6>with custom html/css</h6>
      </div>,
      dom
    );
    return dom;
  };
};

export default InfoCard;
