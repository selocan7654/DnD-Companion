import type {
  ApiResponse,
  DndClassRef,
  DndRaceRef,
  PaginatedResponse,
  ReferenceItem,
  ReferenceListItem,
  ReferenceListQuery,
  ReferenceTypeSlug,
} from '../../types/api';
import { baseApi } from './baseApi';

const ITEM_TYPE_PATHS: Exclude<ReferenceTypeSlug, 'classes' | 'races'>[] = [
  'spells',
  'monsters',
  'feats',
  'backgrounds',
  'magic-items',
  'subclasses',
];

export const referenceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getReferenceList: builder.query<
      PaginatedResponse<ReferenceListItem>,
      { type: Exclude<ReferenceTypeSlug, 'classes' | 'races'>; params?: ReferenceListQuery }
    >({
      query: ({ type, params }) => ({
        url: `/reference/${type}`,
        params: params ?? {},
      }),
      keepUnusedDataFor: 300,
    }),
    getReferenceDetail: builder.query<
      ApiResponse<ReferenceItem>,
      { type: Exclude<ReferenceTypeSlug, 'classes' | 'races'>; id: string }
    >({
      query: ({ type, id }) => `/reference/${type}/${id}`,
      keepUnusedDataFor: 300,
    }),
    getReferenceClasses: builder.query<ApiResponse<DndClassRef[]>, void>({
      query: () => '/reference/classes',
      keepUnusedDataFor: 300,
    }),
    getReferenceRaces: builder.query<ApiResponse<DndRaceRef[]>, void>({
      query: () => '/reference/races',
      keepUnusedDataFor: 300,
    }),
  }),
});

export function isReferenceItemType(
  type: ReferenceTypeSlug,
): type is Exclude<ReferenceTypeSlug, 'classes' | 'races'> {
  return (ITEM_TYPE_PATHS as string[]).includes(type);
}

export const {
  useGetReferenceListQuery,
  useGetReferenceDetailQuery,
  useGetReferenceClassesQuery,
  useGetReferenceRacesQuery,
} = referenceApi;
