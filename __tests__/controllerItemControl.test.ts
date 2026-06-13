import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ControllerItemControl } from "@/components/controls/ControllerItemControl";
import { Slider } from "@/components/controls/Slider";
import type { ControllerItem } from "@/types";

const sliderItem: ControllerItem = {
  paramKey: "contractility",
  kind: "slider",
  label: "LV contractility",
  min: 0.25,
  max: 2.5,
  step: 0.05,
  options: [
    { label: "Low", value: 0.7 },
    { label: "Normal", value: 1 },
    { label: "High", value: 1.4 },
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
  it("renders preset chips above a retained range slider", () => {
    const html = renderToStaticMarkup(renderControl(sliderItem, 1));

    expect(html).toContain("Low");
    expect(html).toContain("Normal");
    expect(html).toContain("High");
    expect(html).toContain('type="range"');
  });

  it("renders preset chips as a labelled group", () => {
    const html = renderToStaticMarkup(renderControl(sliderItem, 1));

    expect(html).toContain('role="group"');
    expect(html).toContain('aria-label="LV contractility"');
  });

  it("marks an active chip within step tolerance", () => {
    const buttons = collectButtons(ControllerItemControl({
      item: sliderItem,
      value: 1.01,
      onChange: vi.fn(),
    }));

    expect(buttons.map((button) => button.props["aria-pressed"]).filter((pressed) => pressed !== undefined)).toEqual([false, true, false]);
    const activeClassName = (buttons[1].props as { className: string }).className;
    expect(activeClassName).toContain("ring-1");
    expect(activeClassName).toContain("ring-wb-accent");
  });

  it("leaves all chips inactive off preset while retaining the slider", () => {
    const element = ControllerItemControl({
      item: sliderItem,
      value: 1.2,
      onChange: vi.fn(),
    });
    const buttons = collectButtons(element);
    const html = renderToStaticMarkup(element);

    expect(buttons.map((button) => button.props["aria-pressed"]).filter((pressed) => pressed !== undefined)).toEqual([false, false, false]);
    expect(html).toContain('type="range"');
  });

  it("clicking a chip fires onChange with the option value", () => {
    const onChange = vi.fn();
    const buttons = collectButtons(ControllerItemControl({
      item: sliderItem,
      value: 1,
      onChange,
    }));

    (buttons[2].props as { onClick: () => void }).onClick();

    expect(onChange).toHaveBeenCalledWith(1.4);
  });

  it("range sliders commit through onCommit instead of live onChange", () => {
    const onChange = vi.fn();
    const sliders = collectSliders(ControllerItemControl({
      item: sliderItem,
      value: 1,
      onChange,
    }));

    expect(sliders).toHaveLength(1);
    const sliderProps = sliders[0].props as { onCommit?: (v: number) => void; onChange?: (v: number) => void };
    expect(typeof sliderProps.onCommit).toBe("function");
    expect(sliderProps.onChange).toBeUndefined();

    sliderProps.onCommit?.(1.2);

    expect(onChange).toHaveBeenCalledWith(1.2);
  });

  it("renders pure buttonGroup controls as chips only", () => {
    const html = renderToStaticMarkup(renderControl({ ...sliderItem, kind: "buttonGroup" }, 1));

    expect(html).toContain("Low");
    expect(html).toContain("Normal");
    expect(html).toContain("High");
    expect(html).not.toContain('type="range"');
  });
});
