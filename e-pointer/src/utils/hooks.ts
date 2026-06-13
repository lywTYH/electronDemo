import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const NARROW_SCREEN_THRESHOLD = 768;

export const useNarrowScreen = () => {
  const [isNarrowScreen, setIsNarrowScreen] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsNarrowScreen(window.innerWidth < NARROW_SCREEN_THRESHOLD);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isNarrowScreen;
};

// ---- useIpcQuery ----

type IpcQueryFn<TData, TParams> = (params: TParams) => Promise<TData>;

interface UseIpcQueryOptions<TData, TParams> {
  queryKey: string | string[];
  queryFn: IpcQueryFn<TData, TParams>;
  params?: TParams;
  enabled?: boolean;
  onSuccess?: (data: TData) => void;
  onError?: (err: Error) => void;
  onSettled?: (data: TData | undefined, err: Error | undefined) => void;
}

const EMPTY_PARAMS = {};

export function useIpcQuery<TData, TParams = Record<string, unknown>>({
  queryKey,
  queryFn,
  params = EMPTY_PARAMS as TParams,
  enabled = true,
  onSuccess,
  onError,
  onSettled
}: UseIpcQueryOptions<TData, TParams>) {
  const [data, setData] = useState<TData | undefined>();
  const [isLoading, setIsLoading] = useState(enabled);
  const [isFetching, setIsFetching] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  const callbacksRef = useRef({ onSuccess, onError, onSettled });
  useEffect(() => {
    callbacksRef.current = { onSuccess, onError, onSettled };
  });

  const queryFnRef = useRef(queryFn);
  useEffect(() => {
    queryFnRef.current = queryFn;
  });

  const queryKeyStr = useMemo(() => JSON.stringify(queryKey), [queryKey]);

  const fetchData = useCallback(async () => {
    setIsFetching(true);
    setIsError(false);
    setError(undefined);
    let resultData: TData | undefined = undefined;
    let resultError: Error | undefined = undefined;
    try {
      resultData = await queryFnRef.current(params);
      setData(resultData);
      callbacksRef.current.onSuccess?.(resultData);
      return resultData;
    } catch (err) {
      resultError = err as Error;
      setError(resultError);
      setIsError(true);
      callbacksRef.current.onError?.(resultError);
      return null;
    } finally {
      setIsLoading(false);
      setIsFetching(false);
      callbacksRef.current.onSettled?.(resultData, resultError);
    }
  }, [params]);

  useEffect(() => {
    if (!enabled) return;
    fetchData();
  }, [queryKeyStr, enabled, fetchData]);

  const refetch = useCallback(() => fetchData(), [fetchData]);

  return { data, isLoading, isFetching, isError, error, refetch };
}

// ---- useIpcMutation ----

type IpcMutationFn<TPayload, TResult> = (payload: TPayload) => Promise<TResult>;

interface UseIpcMutationOptions<TPayload, TResult> {
  mutationFn: IpcMutationFn<TPayload, TResult>;
  onSuccess?: (data: TResult, payload: TPayload) => void;
  onError?: (err: Error, payload: TPayload) => void;
  onSettled?: (data: TResult | undefined, err: Error | undefined, payload: TPayload) => void;
}

export function useIpcMutation<TPayload, TResult>({
  mutationFn,
  onSuccess,
  onError,
  onSettled
}: UseIpcMutationOptions<TPayload, TResult>) {
  const [data, setData] = useState<TResult | undefined>();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  const callbacksRef = useRef({ onSuccess, onError, onSettled });
  useEffect(() => {
    callbacksRef.current = { onSuccess, onError, onSettled };
  });

  const mutationFnRef = useRef(mutationFn);
  useEffect(() => {
    mutationFnRef.current = mutationFn;
  });

  const mutate = useCallback(async (payload: TPayload) => {
    setIsPending(true);
    setIsSuccess(false);
    setIsError(false);
    setError(undefined);
    let res: TResult | undefined = undefined;
    let err: Error | undefined = undefined;
    try {
      res = await mutationFnRef.current(payload);
      setData(res);
      setIsSuccess(true);
      callbacksRef.current.onSuccess?.(res, payload);
    } catch (e) {
      err = e as Error;
      setError(err);
      setIsError(true);
      callbacksRef.current.onError?.(err, payload);
    } finally {
      setIsPending(false);
      callbacksRef.current.onSettled?.(res, err, payload);
    }
  }, []);

  return { mutate, data, isPending, isSuccess, isError, error };
}
