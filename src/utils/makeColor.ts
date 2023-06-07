export default function makeColor(){
  const colors = [
    "#c9c09b",
    "#a1d693",
    "#93d0d6",
    "#93a3d6",
    "#d16272",
    "#62d169",
    "#d17d62",
    "#2a80ba",
    "#5a2aba",
    "#d86f24",
    "#8c9b37",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};
