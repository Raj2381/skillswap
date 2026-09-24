'use client'

import { ChangeEvent, FormEvent, useState } from 'react'
import { Check, ImagePlus, Plus, Sparkles, Trash2, X } from 'lucide-react'
import {
  DashboardShell,
  card,
  button,
  SectionTitle,
} from '@/components/creator/creator-shell'
import { createClient } from '@/lib/supabase/client'

const categories = [
  'Video Editing',
  'Graphic Design',
  'UI/UX Design',
  'Web Development',
  'Photography',
  'Content Writing',
  'Social Media',
  'Music & Audio',
  'Tutoring',
  'Animation',
  'Programming',
  'Other',
]

const deliveryOptions = [
  '1 day',
  '2 days',
  '3 days',
  '5 days',
  '7 days',
  '10 days',
  '14 days',
  'Custom',
]

const defaultDeliverables = [
  '1 edited Instagram Reel',
  'Smooth transitions',
  'Captions',
  'Background music',
  'Color correction',
]

export default function PostGigPage() {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [rate, setRate] = useState('')
  const [delivery, setDelivery] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [deliverables, setDeliverables] = useState(defaultDeliverables)
  const [image, setImage] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [published, setPublished] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const canPublish = Boolean(
    title.trim() &&
      category &&
      description.trim() &&
      Number(rate) >= 100 &&
      delivery,
  )

  const previewTitle = title.trim() || 'Your gig title'

  const previewDescription =
    description.trim() ||
    'Your service description will appear here as you write it.'

  const previewPrice = rate
    ? `₹${Number(rate).toLocaleString('en-IN')}`
    : '₹799'

  const previewTags = tags.length
    ? tags
    : ['Your skills', 'Add tags']

  const validate = () => {
    const next: Record<string, string> = {}

    if (title.trim().length < 5) {
      next.title = 'Use at least 5 characters.'
    }

    if (!category) {
      next.category = 'Choose a category.'
    }

    if (!description.trim()) {
      next.description = 'Add a description for your service.'
    }

    if (!rate || Number(rate) < 100) {
      next.rate = 'Your minimum rate is ₹100.'
    }

    if (!delivery) {
      next.delivery = 'Choose a delivery time.'
    }

    setErrors(next)

    return Object.keys(next).length === 0
  }

  function addTag() {
    const next = tagInput.trim()

    if (
      !next ||
      tags.length >= 8 ||
      tags.some(
        (tag) => tag.toLowerCase() === next.toLowerCase(),
      )
    ) {
      return
    }

    setTags((current) => [...current, next])
    setTagInput('')
  }

  function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (
      !file ||
      !['image/jpeg', 'image/png', 'image/webp'].includes(
        file.type,
      )
    ) {
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      setImage(String(reader.result))
    }

    reader.readAsDataURL(file)
  }

  async function publish(event: FormEvent) {
    event.preventDefault()

    setErrors({})

    if (!validate()) {
      return
    }

    setPublishing(true)

    try {
      const supabase = createClient()

      /*
       * STEP 1:
       * Verify the currently authenticated user.
       */
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) {
        console.error('Supabase auth error:', {
          message: authError.message,
          code: authError.code,
          details: authError.details,
          hint: authError.hint,
        })

        setErrors({
          form: 'Authentication failed. Please sign in again.',
        })

        return
      }

      if (!user) {
        setErrors({
          form: 'Please sign in again before publishing.',
        })

        return
      }

      /*
       * STEP 2:
       * Verify that this authenticated user actually has
       * a creator profile.
       */
      const {
        data: creatorProfile,
        error: creatorProfileError,
      } = await supabase
        .from('creator_profiles')
        .select('user_id, availability')
        .eq('user_id', user.id)
        .maybeSingle()

      if (creatorProfileError) {
        console.error('Creator profile lookup error:', {
          message: creatorProfileError.message,
          code: creatorProfileError.code,
          details: creatorProfileError.details,
          hint: creatorProfileError.hint,
        })

        setErrors({
          form:
            'Unable to verify your creator profile. Please try again.',
        })

        return
      }

      if (!creatorProfile) {
        console.error(
          'Creator profile missing for authenticated user:',
          user.id,
        )

        setErrors({
          form:
            'Creator profile setup is incomplete. Please complete your creator profile before publishing a gig.',
        })

        return
      }

      /*
       * STEP 3:
       * Verify that the main profile has the creator role.
       */
      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        console.error('Profile lookup error:', {
          message: profileError.message,
          code: profileError.code,
          details: profileError.details,
          hint: profileError.hint,
        })

        setErrors({
          form:
            'Unable to verify your account profile. Please try again.',
        })

        return
      }

      if (!profile) {
        setErrors({
          form:
            'Your account profile could not be found. Please complete your profile setup.',
        })

        return
      }

      if (profile.role !== 'creator') {
        console.error('Invalid profile role:', {
          userId: user.id,
          role: profile.role,
        })

        setErrors({
          form:
            'Only creator accounts can publish gigs.',
        })

        return
      }

      /*
       * STEP 4:
       * Build the exact payload that will be inserted.
       *
       * NOTE:
       * The cover image is intentionally NOT required here.
       * The current database column cover_url is nullable,
       * so an image must never block publishing.
       */
      const gigPayload = {
        creator_id: user.id,
        title: title.trim(),
        category,
        description: `${description.trim()}\n\nIncluded: ${deliverables
          .filter(Boolean)
          .join(', ')}`,
        skills: tags,
        basic_charge: Number(rate),
        delivery_days:
          Number.parseInt(delivery, 10) || null,
        published: true,
      }

      console.log('Attempting gig publish:', {
        userId: user.id,
        creatorProfileExists: Boolean(creatorProfile),
        creatorAvailability:
          creatorProfile.availability,
        profileRole: profile.role,
        gigPayload,
      })

      /*
       * STEP 5:
       * Insert the gig.
       *
       * .select().single() makes Supabase return the
       * newly-created row so we can confirm that the
       * database actually accepted the insert.
       */
      const {
        data: createdGig,
        error: gigError,
      } = await supabase
        .from('gigs')
        .insert(gigPayload)
        .select()
        .single()

      /*
       * STEP 6:
       * Print the COMPLETE Supabase error.
       */
      if (gigError) {
        console.error('Gig publish error:', {
          message: gigError.message,
          code: gigError.code,
          details: gigError.details,
          hint: gigError.hint,
        })

        setErrors({
          form: `Gig could not be published: ${gigError.message}`,
        })

        return
      }

      /*
       * STEP 7:
       * Confirm successful database insertion.
       */
      console.log('Gig published successfully:', createdGig)

      setPublished(true)

      /*
       * Clear only the form after successful publishing.
       */
      setTitle('')
      setCategory('')
      setDescription('')
      setRate('')
      setDelivery('')
      setTagInput('')
      setTags([])
      setDeliverables(defaultDeliverables)
      setImage('')
      setErrors({})

      window.setTimeout(() => {
        setPublished(false)
      }, 4200)
    } catch (error) {
      /*
       * Catch unexpected JavaScript/runtime errors.
       */
      console.error('Unexpected gig publish error:', error)

      setErrors({
        form:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred while publishing the gig.',
      })
    } finally {
      setPublishing(false)
    }
  }

  return (
    <DashboardShell>
      <SectionTitle
        title="Post a Gig"
        subtitle="Turn your skills into opportunities and let clients discover your work."
      />

      <form
        onSubmit={publish}
        className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]"
      >
        {errors.form && (
          <p
            role="alert"
            className="rounded-xl border border-rose-300/25 bg-rose-500/10 p-4 text-sm text-rose-200 xl:col-span-2"
          >
            {errors.form}
          </p>
        )}

        <div className="space-y-6">
          <section
            className={`${card} glass-panel space-y-5`}
          >
            <div>
              <h2 className="text-lg font-semibold text-white">
                Tell clients about your service
              </h2>

              <p className="mt-1 text-xs text-[#c8b8c5]">
                Make your offer clear, specific, and easy to
                choose.
              </p>
            </div>

            <Field
              label="Gig Title"
              error={errors.title}
              count={`${title.length} / 80`}
            >
              <input
                value={title}
                maxLength={80}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="e.g. Instagram Reel Editing"
                className={inputClass}
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Category"
                error={errors.category}
              >
                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value)
                  }
                  className={inputClass}
                >
                  <option value="">
                    Select a category
                  </option>

                  {categories.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>

              <Field
                label="Delivery Time"
                error={errors.delivery}
              >
                <select
                  value={delivery}
                  onChange={(event) =>
                    setDelivery(event.target.value)
                  }
                  className={inputClass}
                >
                  <option value="">
                    Choose delivery time
                  </option>

                  {deliveryOptions.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field
              label="Description"
              error={errors.description}
              count={`${description.length} / 1000`}
            >
              <textarea
                value={description}
                maxLength={1000}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Describe what you offer, what the client will receive, and what makes your service valuable."
                className={`${inputClass} min-h-32 resize-y leading-6`}
              />
            </Field>

            <Field label="Your Rate" error={errors.rate}>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm font-semibold text-rose-300">
                  ₹
                </span>

                <input
                  type="number"
                  min="100"
                  value={rate}
                  onChange={(event) =>
                    setRate(
                      event.target.value.replace(
                        /[^0-9]/g,
                        '',
                      ),
                    )
                  }
                  placeholder="799"
                  className={`${inputClass} pl-8`}
                />
              </div>
            </Field>
          </section>

          <section
            className={`${card} glass-panel space-y-5`}
          >
            <div>
              <h2 className="text-lg font-semibold text-white">
                Skills / Tags
              </h2>

              <p className="mt-1 text-xs text-[#c8b8c5]">
                Add up to 8 searchable skills.
              </p>
            </div>

            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(event) =>
                  setTagInput(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addTag()
                  }
                }}
                placeholder="e.g. Premiere Pro"
                className={`${inputClass} flex-1`}
              />

              <button
                type="button"
                onClick={addTag}
                className="rounded-xl border border-rose-300/25 bg-rose-400/10 px-4 text-xs font-semibold text-rose-200 transition hover:bg-rose-400/20"
              >
                <Plus size={15} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 rounded-full border border-rose-300/25 bg-rose-400/10 px-3 py-1.5 text-xs text-rose-100"
                >
                  {tag}

                  <button
                    type="button"
                    onClick={() =>
                      setTags((current) =>
                        current.filter(
                          (item) => item !== tag,
                        ),
                      )
                    }
                    aria-label={`Remove ${tag}`}
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          </section>

          <section
            className={`${card} glass-panel space-y-5`}
          >
            <div>
              <h2 className="text-lg font-semibold text-white">
                Gig Cover Image
              </h2>

              <p className="mt-1 text-xs text-[#c8b8c5]">
                Use a JPG, PNG, or WEBP image to make your gig
                stand out.
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-dashed border-rose-300/25 bg-[#24101a]">
              {image ? (
                <div className="relative">
                  <img
                    src={image}
                    alt="Gig cover preview"
                    className="h-48 w-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={() => setImage('')}
                    className="absolute right-3 top-3 rounded-lg bg-black/60 p-2 text-white"
                    aria-label="Remove image"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ) : (
                <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-400/10 text-rose-200">
                    <ImagePlus size={20} />
                  </span>

                  <span className="text-sm font-semibold text-white">
                    Upload a cover image
                  </span>

                  <span className="text-xs text-[#b8aec9]">
                    JPG, PNG, or WEBP · optional
                  </span>

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImage}
                    className="sr-only"
                  />
                </label>
              )}
            </div>
          </section>

          <section
            className={`${card} glass-panel space-y-4`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  What&apos;s included?
                </h2>

                <p className="mt-1 text-xs text-[#c8b8c5]">
                  Set clear expectations for every client.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setDeliverables((current) => [
                    ...current,
                    `Deliverable ${current.length + 1}`,
                  ])
                }
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-rose-300 hover:bg-rose-400/10"
              >
                <Plus size={14} />
                Add deliverable
              </button>
            </div>

            {deliverables.map((item, index) => (
              <div
                className="flex items-center gap-2"
                key={`${item}-${index}`}
              >
                <Check
                  size={16}
                  className="shrink-0 text-rose-300"
                />

                <input
                  value={item}
                  onChange={(event) =>
                    setDeliverables((current) =>
                      current.map(
                        (value, itemIndex) =>
                          itemIndex === index
                            ? event.target.value
                            : value,
                      ),
                    )
                  }
                  className={`${inputClass} flex-1`}
                />

                <button
                  type="button"
                  onClick={() =>
                    setDeliverables((current) =>
                      current.filter(
                        (_, itemIndex) =>
                          itemIndex !== index,
                      ),
                    )
                  }
                  className="p-2 text-[#aa8291] hover:text-rose-200"
                  aria-label="Remove deliverable"
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </section>

          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="rounded-xl border border-rose-300/20 px-5 py-3 text-xs font-semibold text-[#d8cbd2] transition hover:bg-rose-400/10"
            >
              Save as draft
            </button>

            <button
              type="submit"
              disabled={!canPublish || publishing}
              className={`${button} justify-center px-6 ${
                !canPublish || publishing
                  ? 'cursor-not-allowed opacity-60'
                  : ''
              }`}
            >
              <Sparkles size={15} />

              {publishing
                ? 'Publishing...'
                : 'Publish Gig'}
            </button>
          </div>
        </div>

        <aside className="xl:sticky xl:top-6 xl:self-start">
          <div
            className={`${card} glass-panel overflow-hidden p-0`}
          >
            <div className="border-b border-rose-300/10 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-300">
                Live preview
              </p>
            </div>

            <div className="h-44 bg-gradient-to-br from-[#5f1832] via-[#32131f] to-[#16080d]">
              {image && (
                <img
                  src={image}
                  alt=""
                  className="h-full w-full object-cover opacity-80"
                />
              )}
            </div>

            <div className="space-y-4 p-5">
              <div>
                <p className="text-[11px] text-[#b8aec9]">
                  {category || 'Category'}
                </p>

                <h2 className="mt-1 text-xl font-semibold text-white">
                  {previewTitle}
                </h2>

                <p className="mt-2 text-xs leading-5 text-[#c8b8c5]">
                  {previewDescription}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {previewTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-rose-400/10 px-2.5 py-1 text-[10px] text-rose-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-end justify-between border-t border-rose-300/10 pt-4">
                <div>
                  <p className="text-[10px] text-[#aa8291]">
                    Starting at
                  </p>

                  <p className="text-lg font-bold text-white">
                    {previewPrice}
                  </p>
                </div>

                <p className="text-xs text-[#c8b8c5]">
                  {delivery || 'Delivery time'}
                </p>
              </div>
            </div>
          </div>
        </aside>
      </form>

      {published && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 rounded-2xl border border-emerald-300/25 bg-[#173725] px-4 py-3 text-sm text-emerald-100 shadow-2xl"
        >
          Gig published successfully.
        </div>
      )}
    </DashboardShell>
  )
}

const inputClass =
  'w-full rounded-xl border border-rose-300/15 bg-[#24101a] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-[#92717f] focus:border-rose-400/60 focus:ring-2 focus:ring-rose-400/10'

function Field({
  label,
  count,
  error,
  children,
}: {
  label: string
  count?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between text-xs font-semibold text-[#f2e6eb]">
        <span>{label}</span>

        {count && (
          <span className="font-normal text-[#aa8291]">
            {count}
          </span>
        )}
      </span>

      {children}

      {error && (
        <span className="mt-1.5 block text-[11px] text-rose-300">
          {error}
        </span>
      )}
    </label>
  )
}