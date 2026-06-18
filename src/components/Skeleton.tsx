import React from "react";

export const CardSkeleton: React.FC = () => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%" }}>
      <div className="skeleton" style={{ width: "100%", aspectRatio: "2/3", borderRadius: "16px" }}></div>
      <div className="skeleton" style={{ width: "80%", height: "1.25rem", borderRadius: "4px" }}></div>
      <div className="skeleton" style={{ width: "40%", height: "1rem", borderRadius: "4px" }}></div>
    </div>
  );
};

export const SliderSkeleton: React.FC = () => {
  return (
    <div style={{ padding: "1.5rem 0", width: "100%" }}>
      <div className="skeleton" style={{ width: "200px", height: "1.75rem", marginBottom: "1rem", marginLeft: "1.5rem", borderRadius: "4px" }}></div>
      <div style={{ display: "flex", gap: "1.25rem", overflowX: "hidden", padding: "0 1.5rem" }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} style={{ minWidth: "180px", width: "180px" }}>
            <CardSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
};

export const CarouselSkeleton: React.FC = () => {
  return (
    <div className="skeleton" style={{ width: "100%", height: "70vh", maxHeight: "600px", borderRadius: "0 0 24px 24px" }}></div>
  );
};

export const DetailSkeleton: React.FC = () => {
  return (
    <div className="container" style={{ paddingTop: "6rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div className="skeleton" style={{ width: "100%", height: "40vh", borderRadius: "24px" }}></div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem" }}>
        <div className="skeleton" style={{ width: "250px", aspectRatio: "2/3", borderRadius: "16px" }}></div>
        <div style={{ flex: "1", minWidth: "300px", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="skeleton" style={{ width: "60%", height: "2.5rem", borderRadius: "4px" }}></div>
          <div className="skeleton" style={{ width: "40%", height: "1.5rem", borderRadius: "4px" }}></div>
          <div className="skeleton" style={{ width: "100%", height: "6rem", borderRadius: "8px" }}></div>
          <div className="skeleton" style={{ width: "30%", height: "2.5rem", borderRadius: "24px" }}></div>
        </div>
      </div>
    </div>
  );
};
