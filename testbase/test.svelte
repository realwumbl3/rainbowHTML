<script>
  let count = 0;
</script>

<main>
  <div class="counter-box">
    <h1>Count: {count}</h1>
    <button on:click={() => count += 1}>
      <span>Increment</span>
    </button>
  </div>
</main>

<style>
  main { padding: 1em; }
</style>
