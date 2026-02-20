<template>
  <div class="container">
    <header>
      <h1>{{ title }}</h1>
    </header>
    <main>
      <section v-if="items.length">
        <ul>
          <li v-for="item in items" :key="item.id">
            <strong>{{ item.name }}</strong>
          </li>
        </ul>
      </section>
    </main>
  </div>
</template>

<script>
export default {
  data() {
    return { title: 'Vue Test', items: [] };
  }
}
</script>
