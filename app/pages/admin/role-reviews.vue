<script setup lang="ts">
import { onMounted } from 'vue'

definePageMeta({
  role: 'admin',
})

const { reviews, loading, error, loadReviews, isProcessing, approve, reject } = useAdminRoleReviews()

onMounted(() => {
  void loadReviews()
})
</script>

<template>
  <UContainer class="py-8">
    <UPageHeader
      title="Role Requests"
      description="Approve or reject role requests from new users."
    />

    <UAlert
      v-if="error"
      color="error"
      :description="error"
      class="mb-4"
    />

    <div
      v-if="loading && reviews.length === 0"
      class="px-4 py-6 text-sm text-muted"
    >
      Loading requests...
    </div>

    <div
      v-else-if="!loading && reviews.length === 0"
      class="px-4 py-6 text-sm text-muted"
    >
      No pending role requests.
    </div>

    <div
      v-else
      class="rounded-lg border border-default overflow-hidden"
    >
      <div class="grid grid-cols-[1fr_140px_180px] gap-4 bg-muted px-4 py-3 text-sm font-medium text-muted">
        <span>User</span>
        <span>Requested Role</span>
        <span>Actions</span>
      </div>

      <div
        v-for="review in reviews"
        :key="review.id"
        class="grid grid-cols-[1fr_140px_180px] gap-4 border-t border-default px-4 py-3 items-center"
      >
        <div class="min-w-0">
          <p class="truncate font-medium">
            {{ review.user.name || 'Unnamed user' }}
          </p>
          <p class="truncate text-sm text-muted">
            {{ review.user.email }}
          </p>
        </div>

        <UBadge
          color="neutral"
          variant="subtle"
          class="w-fit capitalize"
        >
          {{ review.requestedRole }}
        </UBadge>

        <div class="flex gap-2">
          <UButton
            size="sm"
            color="success"
            :loading="isProcessing(review.id)"
            @click="approve(review.id)"
          >
            Approve
          </UButton>
          <UButton
            size="sm"
            color="error"
            variant="outline"
            :loading="isProcessing(review.id)"
            @click="reject(review.id)"
          >
            Reject
          </UButton>
        </div>
      </div>
    </div>
  </UContainer>
</template>
