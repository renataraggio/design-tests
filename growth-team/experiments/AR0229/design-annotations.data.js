/* AR0229 — design annotations
 *
 * Authored against NetsoftHoldings/design-team → general/design-annotations/AUTHORING.md.
 *
 * `annotations` is intentionally EMPTY. Per AUTHORING.md the data file is a
 * changelog of deltas between the baseline and the intended design — "you are
 * not inventing tasks". Nobody has recorded the design decisions for this
 * prototype yet, so there is nothing truthful to list. The Annotations drawer
 * and Dev Mode work regardless; Design tasks reads 0 until this is filled in.
 *
 * To add one: describe the change in plain English and follow the
 * describe → annotate loop in AUTHORING.md (classify the verb, pick the most
 * durable target from the ladder, verify the highlight lands).
 */

window.DESIGN_ANNOTATIONS_DATA = {
  pages: [
    { id: 'unusual-activity', label: 'Insights › Unusual activity', route: 'index.html' },
    { id: 'smart-notifications', label: 'Smart notifications', route: 'smart-notifications.html' },
  ],

  annotations: [],
};
