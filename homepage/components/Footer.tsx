import { FaLocationArrow } from "react-icons/fa6";
import MagicButton from "./ui/MagicButton";
import Link from "next/link";

const socialMedia = [
    {
      id: 1,
      img: "/git.svg",
      link: "https://github.com/Meet1733"
    },
    {
      id: 2,
      img: "/twit.svg",
      link: "https://x.com/harsoda_meet"
    },
    {
      id: 3,
      img: "/link.svg",
      link: "https://www.linkedin.com/in/meet1733/"
    },
];

const Footer = () => {
  return (
    <footer className="w-full pt-20 pb-10" id="contact">
      <div className="w-full absolute left-0 -bottom-72 min-h-96">
        <img
          src="/footer-grid.svg"
          alt="grid"
          className="w-full h-full opacity-50 "
        />
      </div>

      <div className="flex flex-col items-center">
        <h1 className="heading lg:max-w-[45vw]">
         Ready to transform <span className="text-purple">your</span> your data labeling experience?
        </h1>
        <p className="text-white-200 md:mt-10 my-5 text-center">
        Reach out today and discover how our platform can revolutionize your workflow.
        </p>
        <a href="mailto:meetharsoda5@gmail.com">
          <MagicButton
            title="Let's get in touch"
            icon={<FaLocationArrow />}
            position="right"
          />
        </a>
      </div>
      <div className="flex mt-16 md:flex-row flex-col justify-between items-center">
        <p className="md:text-base text-sm md:font-normal font-light md:mb-0 mb-4">
          Copyright © 2024 Meet Harsoda
        </p>

        <div className="flex items-center md:gap-3 gap-6">
          {socialMedia.map((info) => (
            <Link href={info.link} target="_blank" key={info.id}>
                <div
                  className="w-10 h-10 cursor-pointer flex justify-center items-center backdrop-filter backdrop-blur-lg saturate-180 bg-opacity-75 bg-black-200 rounded-lg border border-black-300"
                >
                  <img src={info.img} alt="icons" width={20} height={20} />
                </div>
            </Link>
            
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;