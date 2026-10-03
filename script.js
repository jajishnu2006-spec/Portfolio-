// =====================================================================
// Portfolio interactions
// Every part checks that its HTML exists first, so removing a section
// from index.html won't break the rest of the page.
// =====================================================================

// true when the visitor has turned on "reduce motion" on their device
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// true on computers with a mouse (not phones or tablets)
const hasMouse = window.matchMedia("(pointer: fine)").matches;


// ---------- Stagger: items in a [data-stagger] group appear one after another ----------
document.querySelectorAll("[data-stagger]").forEach((group) => {
    [...group.children].forEach((child, i) => child.style.setProperty("--i", i));
});


// ---------- Scroll reveal: fade things in as they scroll into view ----------
const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                revealObserver.unobserve(entry.target); // only animate once
            }
        });
    }, { threshold: 0.12 });

    revealItems.forEach((item) => revealObserver.observe(item));
} else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
}


// ---------- Navigation: close the mobile menu and highlight the current section ----------
const menuToggle = document.getElementById("menu-toggle");
const navLinks = [...document.querySelectorAll(".nav-items a")];
const navSections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

navLinks.forEach((link) => {
    link.addEventListener("click", () => {
        if (menuToggle) menuToggle.checked = false;
    });
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuToggle) menuToggle.checked = false;
});

const backToTop = document.querySelector(".back-to-top");

function onScroll() {
    // The current section is the last one whose top has passed 40% of the way down the screen
    const line = window.innerHeight * 0.4;
    let current = null;
    navSections.forEach((section) => {
        if (section.getBoundingClientRect().top <= line) current = section;
    });

    navLinks.forEach((link) => {
        const isCurrent = current && link.getAttribute("href") === "#" + current.id;
        link.classList.toggle("is-active", Boolean(isCurrent));
        if (isCurrent) {
            link.setAttribute("aria-current", "true");
        } else {
            link.removeAttribute("aria-current");
        }
    });

    // Show the back-to-top button after scrolling one screen down
    if (backToTop) backToTop.classList.toggle("is-visible", window.scrollY > window.innerHeight);
}

// requestAnimationFrame stops onScroll running more than once per frame
let scrollQueued = false;
window.addEventListener("scroll", () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => {
        onScroll();
        scrollQueued = false;
    });
}, { passive: true });
onScroll();


// ---------- Count-up numbers in the hero (e.g. 1,500+) ----------
const counters = document.querySelectorAll("[data-count]");

if (!reduceMotion && "IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            counterObserver.unobserve(entry.target);

            const el = entry.target;
            const target = Number(el.dataset.count);
            const suffix = el.dataset.suffix || "";
            const duration = 1400;
            const start = performance.now();

            function tick(now) {
                const progress = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3); // starts fast, slows down at the end
                el.textContent = Math.round(target * eased).toLocaleString("en-US") + suffix;
                if (progress < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
        });
    }, { threshold: 0.6 });

    counters.forEach((counter) => counterObserver.observe(counter));
}


// ---------- Technical interests tabs ----------
const tabs = [...document.querySelectorAll('[role="tab"]')];

function selectTab(tab) {
    tabs.forEach((other) => {
        const selected = other === tab;
        other.setAttribute("aria-selected", String(selected));
        other.tabIndex = selected ? 0 : -1; // only the open tab is reached with the Tab key
        document.getElementById(other.getAttribute("aria-controls")).hidden = !selected;
    });
}

tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => selectTab(tab));

    // Arrow keys move between tabs, like most tab controls
    tab.addEventListener("keydown", (event) => {
        let next = null;
        if (event.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
        if (event.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (event.key === "Home") next = tabs[0];
        if (event.key === "End") next = tabs[tabs.length - 1];
        if (next) {
            event.preventDefault();
            next.focus();
            selectTab(next);
        }
    });
});


// ---------- Project filters ----------
const filterButtons = document.querySelectorAll("[data-filter]");
const projectCards = document.querySelectorAll(".project-card");

filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const filter = button.dataset.filter;

        filterButtons.forEach((other) => other.setAttribute("aria-pressed", String(other === button)));

        projectCards.forEach((card) => {
            const categories = card.dataset.category.split(" ");
            card.hidden = filter !== "all" && !categories.includes(filter);
        });
    });
});


// ---------- Project details pop-up ----------
const modal = document.getElementById("project-modal");

if (modal) {
    const modalBody = modal.querySelector(".modal-body");

    document.querySelectorAll(".project-open").forEach((button) => {
        button.addEventListener("click", () => {
            // Copy the card into the pop-up, minus the button, with the extra details showing
            const copy = button.closest(".project-card").cloneNode(true);
            copy.querySelector(".project-open").remove();
            copy.querySelector(".project-more").hidden = false;
            copy.querySelector("h3").id = "modal-title";

            modalBody.replaceChildren(...copy.childNodes);
            modal.showModal();
        });
    });

    modal.querySelector(".modal-close").addEventListener("click", () => modal.close());

    // Clicking the dark area outside the pop-up closes it
    modal.addEventListener("click", (event) => {
        if (event.target === modal) modal.close();
    });
}


// ---------- Contact form: check the fields, then open the email app ----------
const form = document.getElementById("contact-form");

if (form) {
    const status = form.querySelector(".form-status");
    // The address is read from the form's action, so it only has to be changed in one place
    const emailTo = form.getAttribute("action").replace("mailto:", "").split("?")[0];

    const messages = {
        valueMissing: {
            Name: "Please enter your name.",
            Email: "Please enter your email address.",
            Message: "Please write a message.",
        },
        typeMismatch: "Please enter a valid email address, like name@example.com.",
    };

    form.noValidate = true; // we show our own messages instead of the browser's pop-ups

    function showFieldError(field, text) {
        const id = field.id + "-error";
        let error = document.getElementById(id);
        if (!error) {
            error = document.createElement("span");
            error.className = "field-error";
            error.id = id;
            field.after(error);
        }
        error.textContent = text;
        field.setAttribute("aria-invalid", "true");
        field.setAttribute("aria-describedby", id);
    }

    function clearFieldError(field) {
        const error = document.getElementById(field.id + "-error");
        if (error) error.remove();
        field.removeAttribute("aria-invalid");
        field.removeAttribute("aria-describedby");
    }

    function setStatus(type, text) {
        status.className = "form-status is-" + type;
        status.innerHTML = "";
        const icon = document.createElement("span");
        icon.className = "material-symbols-outlined";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = type === "success" ? "check_circle" : "error";
        const message = document.createElement("span");
        message.textContent = text;
        status.append(icon, message);
    }

    // Remove a field's error as soon as the visitor fixes it
    form.querySelectorAll("input, textarea").forEach((field) => {
        field.addEventListener("input", () => {
            if (field.checkValidity()) clearFieldError(field);
        });
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        let firstInvalid = null;
        form.querySelectorAll("input, textarea").forEach((field) => {
            field.value = field.value.trim() === "" ? "" : field.value;
            if (field.validity.valueMissing) {
                showFieldError(field, messages.valueMissing[field.name]);
            } else if (field.validity.typeMismatch) {
                showFieldError(field, messages.typeMismatch);
            } else {
                clearFieldError(field);
                return;
            }
            firstInvalid = firstInvalid || field;
        });

        if (firstInvalid) {
            setStatus("error", "Please fix the highlighted fields and try again.");
            firstInvalid.focus();
            return;
        }

        const data = new FormData(form);
        const subject = "Question from your portfolio: " + data.get("Topic");
        const body =
            "Name: " + data.get("Name") + "\n" +
            "Email: " + data.get("Email") + "\n" +
            "Topic: " + data.get("Topic") + "\n\n" +
            data.get("Message");

        window.location.href =
            "mailto:" + emailTo +
            "?subject=" + encodeURIComponent(subject) +
            "&body=" + encodeURIComponent(body);

        setStatus("success",
            "Thanks, " + data.get("Name").split(" ")[0] + "! Your email app should now open with your message ready to send. " +
            "If it doesn't, email me at " + emailTo + ".");
    });
}


// ---------- Magnetic buttons: buttons lean slightly towards the mouse ----------
if (hasMouse && !reduceMotion) {
    document.querySelectorAll(".btn").forEach((button) => {
        button.addEventListener("pointermove", (event) => {
            const box = button.getBoundingClientRect();
            const x = event.clientX - (box.left + box.width / 2);
            const y = event.clientY - (box.top + box.height / 2);
            button.style.transform = `translate(${x * 0.15}px, ${y * 0.25}px)`;
        });
        button.addEventListener("pointerleave", () => {
            button.style.transform = "";
        });
    });
}


// ---------- Hero network: floating dots joined by lines ----------
// Dots near each other are joined by faint lines. On a computer, dots near the mouse join to it too.
const canvas = document.querySelector(".hero-network");

if (canvas && canvas.getContext) {
    const ctx = canvas.getContext("2d");
    const colour = getComputedStyle(document.documentElement).getPropertyValue("--clr-accent").trim() || "#2F4F3A";
    const linkDistance = 130; // how close two dots must be to get a line
    let width = 0;
    let height = 0;
    let dots = [];
    let mouse = null;
    let running = false;

    function setup() {
        const box = canvas.getBoundingClientRect();
        const ratio = Math.min(window.devicePixelRatio || 1, 2); // sharp on Retina screens
        width = box.width;
        height = box.height;
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

        // Fewer dots on small screens, so phones don't slow down
        const count = Math.round(Math.min(70, (width * height) / 14000));
        dots = Array.from({ length: count }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
        }));
        draw();
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = colour;
        ctx.fillStyle = colour;

        dots.forEach((dot, i) => {
            // Lines to the dots after this one (so each pair is only drawn once)
            for (let j = i + 1; j < dots.length; j++) {
                const other = dots[j];
                const distance = Math.hypot(dot.x - other.x, dot.y - other.y);
                if (distance < linkDistance) {
                    ctx.globalAlpha = (1 - distance / linkDistance) * 0.35;
                    ctx.beginPath();
                    ctx.moveTo(dot.x, dot.y);
                    ctx.lineTo(other.x, other.y);
                    ctx.stroke();
                }
            }

            if (mouse) {
                const distance = Math.hypot(dot.x - mouse.x, dot.y - mouse.y);
                if (distance < linkDistance * 1.4) {
                    ctx.globalAlpha = (1 - distance / (linkDistance * 1.4)) * 0.6;
                    ctx.beginPath();
                    ctx.moveTo(dot.x, dot.y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                }
            }

            ctx.globalAlpha = 0.55;
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, 2, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }

    function move() {
        dots.forEach((dot) => {
            dot.x += dot.vx;
            dot.y += dot.vy;
            // Bounce off the edges
            if (dot.x < 0 || dot.x > width) dot.vx *= -1;
            if (dot.y < 0 || dot.y > height) dot.vy *= -1;
        });
    }

    function frame() {
        if (!running) return;
        move();
        draw();
        requestAnimationFrame(frame);
    }

    function start() {
        if (running || reduceMotion) return; // with reduced motion, the dots are drawn once and stay still
        running = true;
        requestAnimationFrame(frame);
    }

    function stop() {
        running = false;
    }

    setup();

    // Rebuild the dots when the hero changes size (e.g. turning a phone sideways)
    let resizeTimer;
    new ResizeObserver(() => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(setup, 150);
    }).observe(canvas);

    // Only animate while the hero is on screen and the tab is open, to save battery
    let heroOnScreen = true;
    new IntersectionObserver(([entry]) => {
        heroOnScreen = entry.isIntersecting;
        heroOnScreen && !document.hidden ? start() : stop();
    }).observe(canvas);

    document.addEventListener("visibilitychange", () => {
        heroOnScreen && !document.hidden ? start() : stop();
    });

    if (hasMouse && !reduceMotion) {
        const stage = canvas.parentElement;
        stage.addEventListener("pointermove", (event) => {
            const box = canvas.getBoundingClientRect();
            mouse = { x: event.clientX - box.left, y: event.clientY - box.top };
        });
        stage.addEventListener("pointerleave", () => {
            mouse = null;
        });
    }
}
