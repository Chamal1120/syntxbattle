<footer class="footer">
    <nav aria-label="Footer navigation">
        <ul class="footer-links">
            <li><a href="/about">/about</a></li>
            <li><a href="/contact">/contact</a></li>
        </ul>
    </nav>

    <address class="footer-meta">
        <span> {new Date().getFullYear()} SyntxBattle</span>
        <a href="mailto:chamal.randika.mcr@gmail.com"> Chamal.randika.mcr@gmail.com </a>
    </address>
</footer>

<style>
    .footer {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        padding: 1.5rem;
        gap: 1rem;
        border-top: 2px solid oklch(80% 0.02 250);
        font-size: 0.9rem;
    }

    .footer-links {
        display: flex;
        margin: 0;
        padding: 0;
        gap: 1rem;
        list-style: none;
    }

    .footer-links a {
        color: inherit;
        text-decoration: none;
    }

    .footer-links a:hover {
        text-decoration: underline;
    }

    .footer-meta {
        display: flex;
        gap: 1rem;
        font-style: normal;
    }
</style>
