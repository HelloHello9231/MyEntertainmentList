let personal = document.getElementById("drop-down");
let options = document.getElementById("options");
let area = document.getElementById("drop");

area.addEventListener("mouseover",() =>
{
  options.style.display = "block";
})

area.addEventListener("mouseout",() =>
{
  options.style.display = "none";
})
