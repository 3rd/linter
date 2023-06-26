# Linting setup

This repo holds some of my linting setup.

## My ESLint Config

I've been using my a **global** and **dynamic** ESLint config for a long time.

It's very special, it's taken me many iterations to get it to work, and it has served me well.
The current version has been stable for a while and works great in my Neovim setup.

👉 [**The Config™**](./eslint)
\
👉 [How I'm using it with Neovim](https://github.com/3rd/config/blob/master/home/dotfiles/nvim/lua/modules/language-support/lsp.lua#L216)

> **Warning**
\
This is my personal setup; it's not a packaged, ready-to-eat solution for others to just plug and have it working.
\
I published it to show how I handle it, but it's not production-quality, so don't throw tomatoes at me.

### A global ESLint config? What?

Having a **global config** might sound like a stupid and impractical idea, but hear me out.

By global config *I don't mean a config that applies when you're in a project that doesn't have ESLint configured*.

I mean **a config that always applies to all the projects**, whether you're in a project without an ESLint configuration,
or in a project that has it's own configuration, it doesn't matter, you always get the global config.

The idea has been frowned upon, argued against, and dismissed as stupid and unworthy of support.

The main arguments/issues have been that:
1. *EveRyOnE in the team should use the same linting configuration.*
2. Different projects use different rules, plugins, and parsers.

#### 1. **Everyone in the team should use the same linting configuration**

Obviously, I disagree with this, and I don't even consider it an argument.
\
When I think about linting as a component of my workflow, my mind splits the concept into two characters:
- **The Project Linter**
    - guards our project's code quality and consistency
    - has a collectively agreed-upon set of rules and plugins
- **My Linter**
    - guards my quality and consistency
    - has a custom set of rules and plugins that I value for myself

**Project linting rules should be enforced on pre-commit, not in my editor.**
\
In a correctly configured linting setup, there is no harm in a developer using their own custom configuration.

#### 2. Different projects use different rules, plugins, and parsers

Of course, using a global linting configuration doesn't make sense with a static config.

The only way this can work is if the configuration is **dynamic** and **automatically generated** when required by ESLint, by inspecting the context the user is in,
analyzing the project, its dependencies, deciding what parser/plugins/rules/settings should be used, etc.

It used to be harder to get this to work in the past; it required lots of hacks and monkey patching to make the ESLint LS ignore everything in the cwd and load the plugins from a different place, but it's gotten better.


### Advantages of using a global config

1. I sit down and truly **design the way I write code** in general.
2. I have a **consistent setup across all the projects** I'm working on.
3. I configure all my linting rules and settings in a **single place**.
4. I **never have to setup ESLint** for my private, one-man projects, again.
5. I have a **much stricter setup** than my team that we'd never agree on, but which makes my work better.
6. I can **use any plugin and any rule** I want, including my own plugins and rules.
7. I can **use things that can't be set up for the whole project** because:
    - Jimmy works on a PotatoPi, and his computer smells like burnt plastic if any resource-intensive rules are used.
    - Jane and Mark insist that they really like `!!` more than `Boolean()` and that it would be a dread for them to get better.
    - I don't want to add my experimental plugins to the project and potentially kill the DX for everyone.

### Conclusion

This setup may be a weird way to do things, but it has worked super well for me.
\
I think thinking about how we work and creating processes and tools to help us be better is something super valuable
that we should invest time in and iterate on.

## AST-GREP

[next-up]
