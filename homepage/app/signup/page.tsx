"use client";

import dynamic from "next/dynamic";
const PinContainer = dynamic(() => import("@/components/ui/Pin").then(mod => mod.PinContainer), { ssr: false });

const data = [
  {
    id: 1,
    title: "Login as a User",
    des: "Effortlessly create and oversee data labeling tasks. Sign in now to start optimizing your workflow.",
    img: "/label.svg",
    link: "https://meetharsoda-portfolio.vercel.app/",
    preview: "User",
  },
  {
    id: 2,
    title: "Login as a Worker",
    des: "Join our community and earn Solana by completing data labeling tasks. Sign in now to start your journey.",
    img: "/solana.png",
    link: "http://localhost:3000",
    preview: "Worker"
  },
];

const RecentProjects = () => {
  return (
    <div className="py-20">
      <h1 className="heading">
       Welcome Back! Choose Your Role to{" "}
        <span className="text-purple">Get Started</span>
      </h1>
      <div className="flex flex-wrap items-center justify-center p-4 gap-x-16 gap-y-8 mt-10">
        {data.map((item) => (
          <div
            className=" sm:h-[41rem] h-[32rem] lg:min-h-[32.5rem] flex items-center justify-center sm:w-[570px] w-[80vw]"
            key={item.id}
          >
            <PinContainer
              title={item.preview}
              href={item.link}
            >
              <div className="relative flex items-center justify-center sm:w-[570px] w-[80vw] overflow-hidden sm:h-[40vh] h-[30vh] mb-10">
                <div
                  className="relative w-full h-full overflow-hidden lg:rounded-3xl"
                  style={{ backgroundColor: "#13162D" }}
                >
                  <img src="/bg.png" alt="bgimg" />
                </div>
                <img
                  src={item.img}
                  alt="cover"
                  className="z-10 absolute w-40 h-32"
                />
              </div>

              <h1 className="font-bold lg:text-2xl md:text-xl text-base line-clamp-1">
                {item.title}
              </h1>

              <p
                className="lg:text-xl lg:font-normal font-light text-sm line-clamp-2"
                style={{
                  color: "#BEC1DD",
                  margin: "1vh 0",
                }}
              >
                {item.des}
              </p>

              {/* <div className="flex items-center justify-between mt-7 mb-3">
                <div className="flex items-center">
                  {item.iconLists.map((icon, index) => (
                    <div
                      key={index}
                      className="border border-white/[.2] rounded-full bg-black lg:w-10 lg:h-10 w-8 h-8 flex justify-center items-center"
                      style={{
                        transform: `translateX(-${5 * index + 2}px)`,
                      }}
                    >
                      <img src={icon} alt="icon5" className="p-2" />
                    </div>
                  ))}
                </div>

                <div className="flex justify-center items-center">
                  <p className="flex lg:text-xl md:text-xs text-sm text-purple">
                    Check Live Site
                  </p>
                  <FaLocationArrow className="ms-3" color="#CBACF9" />
                </div>
              </div> */}
            </PinContainer>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentProjects;