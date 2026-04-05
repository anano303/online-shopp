// "use client";

// import { useState, useEffect, useRef } from "react";
// import { motion } from "framer-motion";
// import { ChevronDown, Heart } from "lucide-react";
// import "./LandingPage.css";
// import Beep from "@/components/beep/beep";
// import FlyingHeartWithWings from "@/components/flyingHeartWithWings/FlyingHeartWithWings";

// // interface Particle {
// //   id: number;
// //   x: number;
// //   y: number;
// //   z: number;
// //   size: number;
// //   opacity: number;
// //   hue: number;
// //   zStart: number;
// //   zEnd: number;
// //   xEnd: number;
// //   yEnd: number;
// //   animationDelay: number;
// //   animationDuration: number;
// // }

// export function LandingPage() {
//   const [showScroll, setShowScroll] = useState(true);
//   // const [particles, setParticles] = useState<Particle[]>([]);
//   // interface FloatingObject {
//   //   id: string;
//   //   x: number;
//   //   y: number;
//   //   z: number;
//   //   delay: number;
//   //   scale: number;
//   // }

//   // const [ setFloatingObjects] = useState<{
//   //   hearts: FloatingObject[];
//   //   balls: FloatingObject[];
//   //   tshirts: FloatingObject[];
//   //   bags: FloatingObject[];
//   // }>({
//   //   hearts: [],
//   //   balls: [],
//   //   tshirts: [],
//   //   bags: [],
//   // });
//   const containerRef = useRef<HTMLDivElement>(null);
//   const soundPath = "_button-beep-2.wav";
//   const soundPath2 = "beep.wav";

//   // Enhanced 3D particles for depth effect
//   // useEffect(() => {
//   //   const particleCount = 150;
//   //   const newParticles = [];

//   //   for (let i = 0; i < particleCount; i++) {
//   //     const zStart = -2500 - Math.random() * 1000;
//   //     const zEnd = 500 + Math.random() * 500;

//   //     const angle = Math.random() * Math.PI * 2;
//   //     const distance = 300 + Math.random() * 500;

//   //     const xEnd = Math.cos(angle) * distance;
//   //     const yEnd = Math.sin(angle) * distance;

//   //     newParticles.push({
//   //       id: i,
//   //       x: 50,
//   //       y: 50,
//   //       z: zStart,
//   //       size: Math.random() * 3 + 1,
//   //       opacity: Math.random() * 0.4 + 0.1,
//   //       hue: Math.random() * 20 + 340,
//   //       zStart: zStart,
//   //       zEnd: zEnd,
//   //       xEnd: xEnd,
//   //       yEnd: yEnd,
//   //       animationDelay: i * (60 / particleCount),
//   //       animationDuration: 30 + Math.random() * 20,
//   //     });
//   //   }

//   //   setParticles(newParticles);
//   // }, []);

//   // Generate floating 3D objects
//   // useEffect(() => {
//   //   const createFloatingObjects = () => {
//   //     const objectCount = {
//   //       hearts: 8,
//   //       balls: 8,
//   //       tshirts: 6,
//   //       bags: 6,
//   //     };

//   //     const newObjects: {
//   //       hearts: FloatingObject[];
//   //       balls: FloatingObject[];
//   //       tshirts: FloatingObject[];
//   //       bags: FloatingObject[];
//   //     } = {
//   //       hearts: [],
//   //       balls: [],
//   //       tshirts: [],
//   //       bags: [],
//   //     };

//   //     for (let i = 0; i < objectCount.hearts; i++) {
//   //       newObjects.hearts.push({
//   //         id: `heart-${i}`,
//   //         x: Math.random() * window.innerWidth - window.innerWidth / 2,
//   //         y: Math.random() * window.innerHeight - window.innerHeight / 2,
//   //         z: Math.random() * -1000 - 500,
//   //         delay: Math.random() * 5,
//   //         scale: Math.random() * 0.7 + 0.3,
//   //       });
//   //     }

//   //     for (let i = 0; i < objectCount.balls; i++) {
//   //       newObjects.balls.push({
//   //         id: `ball-${i}`,
//   //         x: Math.random() * window.innerWidth - window.innerWidth / 2,
//   //         y: Math.random() * window.innerHeight - window.innerHeight / 2,
//   //         z: Math.random() * -1000 - 500,
//   //         delay: Math.random() * 5,
//   //         scale: Math.random() * 0.7 + 0.3,
//   //       });
//   //     }

//   //     for (let i = 0; i < objectCount.tshirts; i++) {
//   //       newObjects.tshirts.push({
//   //         id: `tshirt-${i}`,
//   //         x: Math.random() * window.innerWidth - window.innerWidth / 2,
//   //         y: Math.random() * window.innerHeight - window.innerHeight / 2,
//   //         z: Math.random() * -1000 - 500,
//   //         delay: Math.random() * 5,
//   //         scale: Math.random() * 0.7 + 0.3,
//   //       });
//   //     }

//   //     for (let i = 0; i < objectCount.bags; i++) {
//   //       newObjects.bags.push({
//   //         id: `bag-${i}`,
//   //         x: Math.random() * window.innerWidth - window.innerWidth / 2,
//   //         y: Math.random() * window.innerHeight - window.innerHeight / 2,
//   //         z: Math.random() * -1000 - 500,
//   //         delay: Math.random() * 5,
//   //         scale: Math.random() * 0.7 + 0.3,
//   //       });
//   //     }

//   //     setFloatingObjects(newObjects);
//   //   };

//   //   createFloatingObjects();
//   // }, []);

//   const scrollToContent = () => {
//     window.scrollTo({
//       top: window.innerHeight,
//       behavior: "smooth",
//     });
//   };

//   useEffect(() => {
//     const handleScroll = () => {
//       if (window.scrollY > window.innerHeight / 2) {
//         setShowScroll(false);
//       } else {
//         setShowScroll(true);
//       }
//     };

//     window.addEventListener("scroll", handleScroll);
//     return () => window.removeEventListener("scroll", handleScroll);
//   }, []);

//   return (
//     <div className="landing-container" ref={containerRef}>
//       <div className="landing-depth-layer-1"></div>
//       <div className="landing-depth-layer-2"></div>
//       <div className="landing-depth-layer-3"></div>

//       {/* Floating 3D objects */}
//       {/* <div className="floating-3d-objects">
//         {floatingObjects.hearts.map((obj) => (
//           <div
//             key={obj.id}
//             className="floating-object floating-heart"
//             style={
//               {
//                 left: "50%",
//                 top: "50%",
//                 opacity: 0.2 * obj.scale,
//                 transform: `translate(-50%, -50%) scale(${obj.scale})`,
//                 animationDelay: `${obj.delay}s`,
//                 "--x": obj.x,
//                 "--y": obj.y,
//                 "--z": obj.z,
//               } as React.CSSProperties
//             }
//           />
//         ))}

//         {floatingObjects.balls.map((obj) => (
//           <div
//             key={obj.id}
//             className="floating-object floating-ball"
//             style={
//               {
//                 left: "50%",
//                 top: "50%",
//                 opacity: 0.15 * obj.scale,
//                 transform: `translate(-50%, -50%) scale(${obj.scale})`,
//                 animationDelay: `${obj.delay}s`,
//                 "--x": obj.x,
//                 "--y": obj.y,
//                 "--z": obj.z,
//               } as React.CSSProperties
//             }
//           />
//         ))}

//         {floatingObjects.tshirts.map((obj) => (
//           <div
//             key={obj.id}
//             className="floating-object floating-tshirt"
//             style={
//               {
//                 left: "50%",
//                 top: "50%",
//                 opacity: 0.15 * obj.scale,
//                 transform: `translate(-50%, -50%) scale(${obj.scale})`,
//                 animationDelay: `${obj.delay}s`,
//                 "--x": obj.x,
//                 "--y": obj.y,
//                 "--z": obj.z,
//               } as React.CSSProperties
//             }
//           />
//         ))}

//         {floatingObjects.bags.map((obj) => (
//           <div
//             key={obj.id}
//             className="floating-object floating-bag"
//             style={
//               {
//                 left: "50%",
//                 top: "50%",
//                 opacity: 0.15 * obj.scale,
//                 transform: `translate(-50%, -50%) scale(${obj.scale})`,
//                 animationDelay: `${obj.delay}s`,
//                 "--x": obj.x,
//                 "--y": obj.y,
//                 "--z": obj.z,
//               } as React.CSSProperties
//             }
//           />
//         ))}
//       </div>

//       <div className="landing-particle-container">
//         {particles.map((particle) => (
//           <div
//             key={particle.id}
//             className="landing-particle"
//             style={
//               {
//                 left: "50%",
//                 top: "50%",
//                 width: `${particle.size}px`,
//                 height: `${particle.size}px`,
//                 opacity: 0,
//                 backgroundColor: `hsla(${particle.hue}, 95%, 65%, ${
//                   particle.opacity * 2
//                 })`,
//                 animation: `particle-depth ${particle.animationDuration}s infinite linear ${particle.animationDelay}s`,
//                 "--z-start": `${particle.zStart}px`,
//                 "--z-end": `${particle.zEnd}px`,
//                 "--x-end": `${particle.xEnd}px`,
//                 "--y-end": `${particle.yEnd}px`,
//                 "--opacity": particle.opacity,
//                 boxShadow: `0 0 ${particle.size * 2}px hsla(${
//                   particle.hue
//                 }, 95%, 75%, 0.8)`,
//               } as React.CSSProperties
//             }
//           />
//         ))} */}
//       {/* </div> */}

//       <div className="landing-content">
//         <motion.div className="landing-text">
//           <div className="landing-contents">
//             <Beep soundSrc={soundPath} shape="heart" />
//             <Beep soundSrc={soundPath2} shape="star" />
//           </div>
//           <div className="landing-contents-logo">
//             <FlyingHeartWithWings size={200} />
//           </div>
//           <div className="landing-contents">
//             <Beep soundSrc={soundPath2} shape="star2" />
//             <Beep soundSrc={soundPath} shape="heart2" />
//           </div>
//         </motion.div>
//       </div>

//       {showScroll && (
//         <motion.div
//           className="scroll-indicator"
//           animate={{ y: [0, 10, 0] }}
//           transition={{ duration: 1.5, repeat: Infinity }}
//           onClick={scrollToContent}
//         >
//           <p>ჩამოსქროლე</p>
//           <ChevronDown size={24} className="scroll-icon" />
//           <Heart
//             size={14}
//             className="scroll-heart"
//             fill="#e91e63"
//             color="#e91e63"
//           />
//         </motion.div>
//       )}
//     </div>
//   );
// }
