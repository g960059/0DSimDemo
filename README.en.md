[日本語](./README.md) | **English**

# CircleHeart

CircleHeart is an education and research platform for **learning, exploring, and sharing cardiovascular hemodynamics**.

[Open CircleHeart](https://www.circleheart.dev/) · [Read articles](https://www.circleheart.dev/en/articles) · [Start a simulation](https://www.circleheart.dev/en/experiments/new)

## From numbers to an explainable understanding

Memorizing values such as blood pressure and cardiac output is not enough to understand why a circulation changes. CircleHeart places interactive simulation alongside educational articles. Readers can adjust preload, afterload, contractility, and other conditions, then observe the effects on pressure waveforms, pressure-volume relations, and derived measures.

CircleHeart can be used to:

- learn core hemodynamic concepts through articles and guided simulations;
- reproduce and compare clinical conditions and interventions;
- interpret graphs and measurements together; and
- save and share simulations and the knowledge built around them.

## For learners, clinicians, and researchers

CircleHeart is intended for people beginning to learn hemodynamics, including residents and clinical engineers; experienced clinicians in cardiology, anesthesiology, and intensive care; and researchers studying cardiovascular dynamics.

- **Learners** predict a change, test it in a simulation, and connect the result to physiology.
- **Experienced clinicians** compare conditions and interventions using several complementary signals.
- **Researchers** examine model assumptions and limitations and use them to guide further validation and development.

## Our approach to mathematical modeling

CircleHeart uses a reduced mathematical representation of the circulation, organized as a small number of interacting compartments and physiological relations. Complexity is not a goal in itself.

We aim for physiologically and physically sound reduced-order models that remain computationally robust and efficient while retaining enough expressive power to represent a broad range of clinical conditions. The design also considers future parameter estimation and model fitting.

Model development emphasizes:

- **explainability** — changes can be traced through physiological relationships;
- **interactivity** — simulations remain usable on ordinary devices;
- **verifiability** — assumptions, supported behavior, and limitations are made explicit; and
- **extensibility** — the same foundation can continue to support education, research, and future fitting workflows.

## Connecting education and model development

Educational content and mathematical model development inform each other. Questions that emerge while building articles and cases can guide improvements to the model. Findings from model development can return as new articles, simulations, and shared knowledge.

## Intended use and limitations

CircleHeart is intended for education and research support. It is not a medical device and must not be used for diagnosis, treatment decisions, drug dosing, or patient-specific prediction.

Simulation results follow from the assumptions and inputs represented by the model. Real patients include physiology, individual variation, time-dependent changes, and treatment effects that may not be represented. Treat numerical results as model outputs, not as clinical facts, and review the assumptions and limitations stated with each piece of content.

## Project

CircleHeart is an ongoing project for hemodynamic education, knowledge sharing, and continuous mathematical model development. Feedback and suggestions are welcome through [GitHub Issues](https://github.com/g960059/0DSimDemo/issues).
