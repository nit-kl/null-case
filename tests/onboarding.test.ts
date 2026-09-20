import { expect, it } from "vitest";
import { HotelAdapter } from "../src/game/data-sources/HotelAdapter";
import { checkedRoomSearch, decodeTutorial, emptyTutorial, tutorialData, tutorialStep } from "../src/game/story/onboarding";

it("only the actual room 404 zero result advances the first search", () => {
  const hotel = new HotelAdapter();
  expect(checkedRoomSearch(hotel.execute(tutorialData.roomQuery), tutorialData.roomQuery)).toBe(true);
  const other = "SELECT * FROM rooms WHERE room_number = 999;";
  expect(checkedRoomSearch(hotel.execute(other), other)).toBe(false);
  expect(checkedRoomSearch(hotel.execute("SELECT * FROM rooms;"), tutorialData.roomQuery)).toBe(false);
  expect(checkedRoomSearch(hotel.execute(tutorialData.noteQuery), tutorialData.roomQuery)).toBe(false);
});
it("uses real discovery and registration, including existing progress", () => {
  const id = tutorialData.noteEvidenceId;
  expect(tutorialStep(emptyTutorial(), [], [])).toBe("rooms");
  expect(tutorialStep({ ...emptyTutorial(), roomsChecked: true }, [], [])).toBe("notes");
  expect(tutorialStep(emptyTutorial(), [id], [])).toBe("register");
  expect(tutorialStep(emptyTutorial(), [id], [id])).toBe("complete");
  expect(tutorialStep(emptyTutorial(), [], ["unrelated"])).toBe("rooms");
});
it("validates tutorial progress without touching investigation saves", () => {
  expect(decodeTutorial(JSON.stringify({ ...emptyTutorial(), dismissed: true }))).toEqual({ ...emptyTutorial(), dismissed: true });
  for (const raw of ["null", "{}", "{broken", '{"version":99,"roomsChecked":true,"dismissed":false}', '{"version":1,"roomsChecked":"yes","dismissed":false}']) expect(() => decodeTutorial(raw)).toThrow();
});
