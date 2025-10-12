def find_max(nums):
    maxi=0
    for i in nums:
        if i>maxi:
            maxi=i
    retrun maxi

# Test execution
if __name__ == "__main__":
    try:
        # Find the first function defined in user code
        import inspect
        import sys
        
        current_module = sys.modules[__name__]
        functions = [name for name, obj in inspect.getmembers(current_module, inspect.isfunction) 
                    if not name.startswith('__')]
        
        if functions:
            func = getattr(current_module, functions[0])
            result = func([10,22,5,75,65,80])
            print(result)
        else:
            print("No function found")
    except Exception as e:
        print(f"Error: {e}")
