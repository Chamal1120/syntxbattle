<script>
    /**
     * Syntxbattle - Navbar Component
     *
     * * @author Chamal Mallawaarachchi
     */
</script>

<footer class="footer">
    <!--<nav aria-label="Footer navigation">
        <ul class="footer-links">
            <li><a href="/about">about</a></li>
            <li><a href="/contact">contact</a></li>
        </ul>
    </nav>-->

    <address class="footer-meta">
        <p>© {new Date().getFullYear()} SyntxBattle</p>
        <a href="mailto:chamal.randika.mcr@gmail.com"> Chamal.randika.mcr@gmail.com </a>
    </address>
</footer>

<style>
    .footer {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        margin: 0rem 1rem;
        padding: 1rem 0.5rem;
        border-top: 2px solid oklch(80% 0.02 250);
        font-size: 0.9rem;
    }

    /*.footer-links {
        display: flex;
        margin: 0;
        padding: 0;
        gap: 1rem;
        list-style: none;
    }*/

    .footer a {
        color: inherit;
        text-decoration: none;
    }

    .footer a:hover {
        text-decoration: underline;
    }

    .footer-meta {
        display: flex;
        flex-grow: 1;
        justify-content: space-between;
        gap: 1rem;
        font-style: normal;
    }
</style>
