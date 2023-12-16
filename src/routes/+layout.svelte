<script>
  import "./app.css";
</script>

<main>
  <slot />
</main>

<style>
  main {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 7fr 1fr 2fr;
    gap: 1rem;
    padding: 0.5rem;
    height: 100vh;
  }
</style>
