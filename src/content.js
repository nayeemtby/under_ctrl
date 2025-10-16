const hideReels = () => {
  const elms = document.querySelectorAll(
    "[href*='/reel/'][aria-label='reel'] "
  );
  elms.forEach((elm) => {
    let parent = elm.parentElement;
    while (
      parent &&
      !parent.classList.contains("x1lliihq") &&
      parent.tagName !== "BODY"
    ) {
      parent = parent.parentElement;
    }
    if (parent.tagName !== "BODY") {
      if (parent.style.display !== "none") {
        parent.style.display = "none";
        console.log("Reel block hidden");
      }
      elm.remove();
    } else if (elm.parentElement) {
      elm.parentElement.style.display = "none";
      console.log("Reel item hidden");
      elm.remove();
    }
  });
};

console.log("Content script loaded");
console.log(chrome);
window.onscrollend = function () {
  console.log("Scroll ended");
  hideReels();
};

document.addEventListener("DOMContentLoaded", function () {
  // Your code to manipulate the DOM goes here
  console.log("Content script loaded and ready to interact with the page.");
});
