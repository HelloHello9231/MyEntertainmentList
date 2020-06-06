let people = Array.from(document.querySelectorAll(".person"));

people.forEach((person) =>
{
  person.addEventListener("click",() =>
  {
      window.location.href = `/personInfo?id=${person.id}`;
  })
})
