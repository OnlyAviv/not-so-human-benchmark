# Not-So-Human Benchmark

This program aims to automate Human Benchmark tests using Playwright. It provides a set of commands to run different tests and allows customization of delay between actions and words per minute for typing tests.

## Requirements

- Node.js
- npm (Node Package Manager)

## Installation

```bash
npm install -g not-so-human-benchmark
```

## Usage

### Command Line Interface

```bash
not-so-human-benchmark [command] [options]
```

### Commands and Options

- **reactiontime**: Run reaction time test.

  Options:
  - `-d, --delay [time]`: The delay between actions, in milliseconds.

  Example:
  ```bash
  not-so-human-benchmark reactiontime --delay 100
  ```

- **aim**: Run aim test.

  Options:
  - `-d, --delay [time]`: The delay between actions, in milliseconds.

  Example:
  ```bash
  not-so-human-benchmark aim --delay 50
  ```

- **number-memory**: Run number memory test.

  Example:
  ```bash
  not-so-human-benchmark number-memory
  ```

- **verbal-memory**: Run verbal memory test.

  Example:
  ```bash
  not-so-human-benchmark verbal-memory
  ```

- **chimp**: Run chimp test.

  Options:
  - `-d, --delay [time]`: The delay between actions, in milliseconds.

  Example:
  ```bash
  not-so-human-benchmark chimp --delay 200
  ```

- **memory**: Run memory test.

  Example:
  ```bash
  not-so-human-benchmark memory
  ```

- **typing**: Run typing test.

  Options:
  - `--wordsperminute [wpm]`: How many words per minute to type.
  - `-d, --delay [time]`: The delay between actions, in milliseconds.

  Example:
  ```bash
  not-so-human-benchmark typing --wordsperminute 60
  ```
    > `--wordperminute` is not accurate, but a rough estimate. If accuracy is needed, use `--delay` instead

- **sequence**: Run sequence memory test.

  Options:
  - `-d, --delay [time]`: The delay between actions, in milliseconds.

  Example:
  ```bash
  not-so-human-benchmark sequence --delay 300
  ```

### Quitting Tests

During a benchmark test, type <kbd>q</kbd>+<kbd>Enter</kbd> to quit the current test. Type <kbd>q</kbd>+<kbd>Enter</kbd> again to exit the program.