export default function makeColor(){
  const colors = [
    "#99130f",
    "#0f1f99",
    "#4c5bd3",
    "#d3c84c",
    "#d34c9f",
    "#151e5e" 
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};
