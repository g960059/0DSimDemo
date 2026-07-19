import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ControllerItemControl } from "@/components/controls/ControllerItemControl";
import { Slider } from "@/components/controls/Slider";
import type { ControllerItem } from "@/types";

const sliderItem: ControllerItem = {
  paramKey: "circulation.systemic-vascular-resistance-scale",
  kind: "slider",
  label: "Systemic resistance scale",
  min: 0.25,
  max: 4,
  step: 0.25,
  options: [
    { label: "0.25×", value: 0.25 },
    { label: "0.50×", value: 0.5 },
    { label: "0.75×", value: 0.75 },
    { label: "1.0×", value: 1 },
    { label: "1.5×", value: 1.5 },
    { label: "2.0×", value: 2 },
    { label: "3.0×", value: 3 },
    { label: "4.0×", value: 4 },
  ],
};

function renderControl(item: ControllerItem, value: number, onChange = vi.fn()) {
  return React.createElement(ControllerItemControl, {
    item,
    value,
    onChange,
  });
}

function collectButtons(node: React.ReactNode): React.ReactElement[] {
  if (!React.isValidElement(node)) return [];
  if (node.type === Slider) return [];
  if (typeof node.type === "function") {
    const Component = node.type as (props: unknown) => React.ReactNode;
    return collectButtons(Component(node.props));
  }
  const props = node.props as { children?: React.ReactNode };
  const current = typeof node.type === "string" && node.type === "button" ? [node] : [];
  return current.concat(React.Children.toArray(props.children).flatMap(collectButtons));
}

function collectSliders(node: React.ReactNode): React.ReactElement[] {
  if (!React.isValidElement(node)) return [];
  if (node.type === Slider) return [node];
  if (typeof node.type === "function") {
    const Component = node.type as (props: unknown) => React.ReactNode;
    return collectSliders(Component(node.props));
  }
  const props = node.props as { children?: React.ReactNode };
  return React.Children.toArray(props.children).flatMap(collectSliders);
}

describe("ControllerItemControl", () => {
  it("renders the broad resistance envelope as eight exact indexed stops", () => {
    const html = renderToStaticMarkup(renderControl(sliderItem, 1));

    expect(html).toContain("0.25×");
    expect(html).toContain("0.75×");
    expect(html).toContain("1.0×");
    expect(html).toContain("4.0×");
    expect(html).toContain('type="range"');
    expect(html).toContain('min="0"');
    expect(html).toContain('max="7"');
    expect(html).toContain('step="1"');
    expect(html).toContain('value="3"');
  });

  it("uses the control label on the slider without rendering preset buttons", () => {
    const html = renderToStaticMarkup(renderControl(sliderItem, 1));

    expect(html).toContain('aria-label="Systemic resistance scale"');
    expect(html).not.toContain('role="group"');
    expect(collectButtons(ControllerItemControl({
      item: sliderItem,
      value: 1,
      onChange: vi.fn(),
    }))).toHaveLength(0);
  });

  it("shows the exact anchor label instead of rounding an uneven-stop value", () => {
    const html = renderToStaticMarkup(renderControl({
      paramKey: "circulation.arterial-stiffness",
      kind: "slider",
      label: "Arterial PV stiffness",
      min: 0.4,
      max: 3,
      step: 0.15,
      options: [
        { label: "0.4", value: 0.4 },
        { label: "0.55", value: 0.55 },
        { label: "0.75", value: 0.75 },
        { label: "1", value: 1 },
        { label: "1.5", value: 1.5 },
        { label: "2", value: 2 },
        { label: "3", value: 3 },
      ],
    }, 0.75));

    expect(html).toContain("0.75");
    expect(html).not.toContain(">0.8<");
    expect(html).toContain('aria-valuetext="0.75"');
  });

  it("passes only the exact runtime values to the indexed slider", () => {
    const sliders = collectSliders(ControllerItemControl({
      item: sliderItem,
      value: 1,
      onChange: vi.fn(),
    }));
    const sliderProps = sliders[0].props as {
      stops?: readonly { label: string; value: number }[];
    };

    expect(sliderProps.stops?.map(({ value }) => value)).toEqual([
      0.25,
      0.5,
      0.75,
      1,
      1.5,
      2,
      3,
      4,
    ]);
  });

  it("exposes a precise model description as a hover tooltip and accessible description", () => {
    const description =
      "Dimensionless model factor, not PVR in Wood units or a diagnosis.";
    const html = renderToStaticMarkup(React.createElement(
      ControllerItemControl,
      {
        item: sliderItem,
        value: 1,
        description,
        onChange: vi.fn(),
      },
    ));

    expect(html).toContain(`title="${description}"`);
    expect(html).toContain(`aria-description="${description}"`);
  });

  it("forwards drag changes and release commits through separate callbacks", () => {
    const onChange = vi.fn();
    const onCommit = vi.fn();
    const sliders = collectSliders(ControllerItemControl({
      item: sliderItem,
      value: 1,
      onChange,
      onCommit,
    }));
    const sliderProps = sliders[0].props as {
      onChange?: (v: number) => void;
      onCommit?: (v: number) => void;
    };

    sliderProps.onChange?.(4);

    expect(onChange).toHaveBeenCalledWith(4);
    expect(onCommit).not.toHaveBeenCalled();

    sliderProps.onCommit?.(4);
    expect(onCommit).toHaveBeenCalledWith(4);
  });

  it("keeps continuous slider drafts local until their release commit", () => {
    const onChange = vi.fn();
    const onCommit = vi.fn();
    const sliders = collectSliders(ControllerItemControl({
      item: { ...sliderItem, options: undefined },
      value: 1,
      onChange,
      onCommit,
    }));
    const sliderProps = sliders[0].props as {
      onChange?: (v: number) => void;
      onCommit?: (v: number) => void;
    };

    expect(sliderProps.onChange).toBeUndefined();
    expect(onChange).not.toHaveBeenCalled();
    expect(onCommit).not.toHaveBeenCalled();

    sliderProps.onCommit?.(1.25);
    expect(onCommit).toHaveBeenCalledWith(1.25);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("falls back to onChange when an enumerated slider has no commit callback", () => {
    const onChange = vi.fn();
    const sliders = collectSliders(ControllerItemControl({
      item: sliderItem,
      value: 1,
      onChange,
    }));
    const sliderProps = sliders[0].props as {
      onCommit?: (v: number) => void;
    };

    sliderProps.onCommit?.(0.25);

    expect(onChange).toHaveBeenCalledWith(0.25);
  });

  it("renders pure buttonGroup controls as chips only", () => {
    const html = renderToStaticMarkup(renderControl({ ...sliderItem, kind: "buttonGroup" }, 1));

    expect(html).toContain("0.25×");
    expect(html).toContain("1.0×");
    expect(html).toContain("4.0×");
    expect(html).not.toContain('type="range"');
  });
});
