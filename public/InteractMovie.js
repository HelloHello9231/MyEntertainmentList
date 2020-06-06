let movies = Array.from(document.querySelectorAll(".movie"));

movies.forEach((movie) =>
{
  movie.addEventListener("click",() =>
  {
      window.location.href = `/movieInfo?id=${movie.id}`;
  })
})
