import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../auth/middleware'
import { asyncHandler } from '../http/async-handler'
import { globalSearch } from './search.service'

const searchQuerySchema = z.object({
  q: z.string().default(''),
})

export const searchRouter = Router()

searchRouter.use(requireAuth)

searchRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = searchQuerySchema.parse(req.query)
    res.json(await globalSearch(query.q))
  }),
)

