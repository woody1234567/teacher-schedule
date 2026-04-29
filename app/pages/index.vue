<script setup lang="ts">
definePageMeta({
  title: 'Teacher Schedule - Home',
  auth: false,
})
</script>

<template>
  <div>
    <UPageHero
      title="Manage Your Teaching Schedule Efficiently"
      description="The all-in-one platform for teachers to organize classes, track students, and manage time effortlessly."
      :links="[
        { label: 'Get Started', to: '/auth/register', size: 'xl' },
        { label: 'Login', to: '/auth/login', color: 'neutral', variant: 'subtle', size: 'xl' }
      ]"
      orientation="horizontal"
    >
      <img src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop" alt="Classroom environment" class="rounded-xl shadow-2xl ring ring-default object-cover aspect-video" />
    </UPageHero>

    <UPageSection
      id="features"
      headline="Features"
      title="Everything a Teacher Needs"
      description="Designed specifically for educators to simplify their daily workflows."
      :features="[
        { title: 'Smart Scheduling', description: 'Easily drag and drop classes into your weekly schedule.', icon: 'i-lucide-calendar-clock' },
        { title: 'Student Tracking', description: 'Keep track of student progress, attendance, and grades.', icon: 'i-lucide-users' },
        { title: 'Automated Reminders', description: 'Never miss a class with automated SMS and email reminders.', icon: 'i-lucide-bell-ring' }
      ]"
    />

    <UPageCTA
      title="Ready to transform your teaching?"
      description="Join hundreds of teachers who are already saving hours every week."
      :links="[
        { label: 'Register Now', to: '/auth/register', color: 'primary', size: 'lg' }
      ]"
    />
  </div>
</template>
