import React from "react";
import LandingFooter from "./_components/LandingFooter";
import LandingHeader from "./_components/LandingHeader";

function layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LandingHeader />
      <main>{children}</main>
      <LandingFooter />
    </>
  );
}

export default layout;
