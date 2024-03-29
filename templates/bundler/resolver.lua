local _bundler_load, _bundler_register = (function(superRequire)
    local loadingPlaceholder = { [{}] = true }

    local register
    local modules = {}

    local load
    local loaded = {}

    ---@param name string
    ---@param body function
    register = function(name, body)
        if not modules[name] then
            modules[name] = body
        end
    end

    ---@param name string
    ---@return any
    load = function(name)
        local loadedModule = loaded[name]

        if loadedModule then
            if loadedModule == loadingPlaceholder then
                return nil
            end
        else
            if not modules[name] then
                if not superRequire then
                    local identifier = type(name) == 'string' and '\"' .. name .. '\"' or tostring(name)
                    error('Tried to require ' .. identifier .. ', but no such module has been registered')
                else
                    return superRequire(name)
                end
            end

            loaded[name] = loadingPlaceholder
            loadedModule = modules[name]()
            loaded[name] = loadedModule
        end

        return loadedModule
    end

    return load, register
end)(require)
