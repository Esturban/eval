const accordionHeader = document.querySelectorAll(".accordion-header");
accordionHeader.forEach((header) => {
header.addEventListener("click", function () {
    const accordionContent = header.parentElement.querySelector(".accordion-content");
    let accordionMaxHeight = accordionContent.style.maxHeight;

    // Condition handling
    if (accordionMaxHeight == "0px" || accordionMaxHeight.length == 0) {
    accordionContent.style.maxHeight = `${accordionContent.scrollHeight + 32}px`;
    header.querySelector(".fas").classList.remove("fa-plus");
    header.querySelector(".fas").classList.add("fa-minus");
    header.parentElement.classList.add("bg-indigo-50");
    } else {
    accordionContent.style.maxHeight = `0px`;
    header.querySelector(".fas").classList.add("fa-plus");
    header.querySelector(".fas").classList.remove("fa-minus");
    header.parentElement.classList.remove("bg-indigo-50");
    }
});
});
function carousel(testimonialsData) {
    return {
        testimonials: JSON.parse(testimonialsData), // Load testimonials data
        activeSlide: 0, // Active slide
        timer: null, // Timer for autoplay

        // Init function
        init() {
            this.timer = setInterval(this.nextSlide, 5000); // Change slide every 5 seconds
        },

        // Change to the next slide
        nextSlide() {
            this.activeSlide = (this.activeSlide + 1) % this.testimonials.length; // Cycle through slides
        },

        // Change to a specific slide
        changeSlide(index) {
            clearInterval(this.timer); // Clear the timer
            this.activeSlide = index; // Set the active slide
            this.timer = setInterval(this.nextSlide, 5000); // Restart the timer
        },

        // Pause the carousel
        pauseCarousel() {
            clearInterval(this.timer); // Clear the timer
        },

        // Resume the carousel
        resumeCarousel() {
            this.timer = setInterval(this.nextSlide, 5000); // Restart the timer
        }
    }
}
