<script lang="ts">
  import { clickOutside } from "$lib/actions";
  import { fly } from "svelte/transition";

  export let type: App.MenuBarOption;
  export let view: App.MenuBarOption | null;
  export let items: { [key: string]: (...args: any) => any };
</script>

<article class="relative h-full">
  <button
    class="h-full cursor-pointer group px-4 py-1 rounded-[4px] hover:bg-gray-100 transition-colors flex items-center"
    on:click|stopPropagation={() => {
      if (view === type) view = null;
      else view = type;
    }}
  >
    <p class="text-sm text-gray-700">{type}</p>
  </button>
  {#if view === type}
    <nav
      class="absolute px-4 py-3 mt-3 top-full left-0 flex flex-col gap-2 bg-white rounded-md shadow-md w-max"
      use:clickOutside={() => (view = null)}
      in:fly={{ y: -15, duration: 100 }}
      out:fly={{ y: -15, duration: 100 }}
    >
      {#each Object.entries(items) as [name, action]}
        <button
          class="text-left text-sm text-gray-600 hover:text-gray-900"
          on:click={() => {
            action();
            view = null;
          }}
        >
          {name}
        </button>
      {/each}
    </nav>
  {/if}
</article>
