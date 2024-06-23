const START_STOP = "[*]";
const STATE = 'state';
const CHOICE = '<<choice>>';

module.exports = function toMermaid({ name, definition }) {
  const { StartAt, States } = definition;
  const diagram = new Mermaid({ StartAt, States });

  return diagram.toString();
};

// Task n/e
// Wait n/e
// Pass n/e
// Fail n/e
//
// Parallel <<fork>>
// Map  <<state>>
// Choice <<choice>>

const stepTypes = ['Task', 'Wait', 'Pass', 'Fail'];

class Mermaid {
  constructor({ startAt, states }) {
    this.steps = [];
    this.forks = [];
    this.stack = [];

    this.steps.push([START_STOP, startAt]);

    this.stack.push(startAt);

    while (this.stack.length) {
      const step = this.stack.splice(0, 1)[0];
      const state = states[step];

      if (stepTypes.includes(state.Type)) {
        this.processStep({step, state, states});
      } else if (state.Type === 'Parallel') {
        this.processParallel({step, state});
      } else if (state.Type === 'Map') {
        this.processMap({step, state});
      } else if (state.Type === 'Choice') {
        this.processChoice({step, state});
      } else {
        console.log({step, state});
        throw new Error(`${state.Type} is unsupported`);
      }
    }

  }

  processStep({step, state, states}) {
      if (state.Next && states[state.Next].Type === 'Parallel') {
        // What?
      } else if (state.Next) {
        this.steps.push([step, state.Next]);
        stack.push(state.Next);
      } else if (state.End) {
        this.steps.push([step, START_STOP]);
      }
  }

  processMap({step, state, states}) {
  }

  processParallel({step, state, states}) {
    // What?
  }

  processChoice({step, state }) {
    this.steps.push([STATE, step, CHOICE]);
    for(const choice of state.Choices) {
      const {Next, Variable, NumericEquals} = choice;
      this.steps.push([step, `${Next} : ${Variable} = ${NumericEquals}`]);
      this.stack.push(Next);
    }
  }

  toString() {
    const steps = this.steps.map((line) => line.join(" --> ")).join("\n  ");

    const out = `
mermaidstateDiagram-v2
  ${steps}
`;

    return out;
  }
}
