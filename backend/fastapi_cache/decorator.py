import functools

def cache(expire=60, namespace="", *args, **kwargs):
    def wrapper(func):
        @functools.wraps(func)
        async def inner(*f_args, **f_kwargs):
            return await func(*f_args, **f_kwargs)
        return inner
    return wrapper
