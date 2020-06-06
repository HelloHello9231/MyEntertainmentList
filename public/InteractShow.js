let shows = Array.from(document.querySelectorAll(".show"));

shows.forEach((show) =>
{
  show.addEventListener("click",() =>
  {
      window.location.href = `/showInfo?id=${show.id}`;
  })
})
